# Plan: Fix Review Logic

GitHub Issue: #2

## Overview

Replaces the open review form on the public report page with a dedicated, token-based review page at `/review/{token}`. Tokens are single-use, expire after 90 days, and are generated at inspection signing time when a customer email is provided. Adds customer email input to the inspection creation flow (Step 2) and an editable email field on the sign page. Sends a transactional email via Resend after signing with links to the report and review page.

Based on: `specs/flows/post-purchase-review.md`, `specs/flows/inspection-signing.md`, `specs/flows/inspection-creation.md`, `specs/ui/review-page.md`, `specs/ui/email-templates.md`, `specs/ui/report-public.md`, `specs/ui/inspection-form.md`, `specs/ui/review-sign.md`, `specs/entities/review-token.md`, `specs/entities/review.md`, `specs/entities/inspection-detail.md`.

## References

- Flow specs: `specs/flows/post-purchase-review.md`, `specs/flows/inspection-signing.md`, `specs/flows/inspection-creation.md`
- UI specs: `specs/ui/review-page.md`, `specs/ui/email-templates.md`, `specs/ui/report-public.md`, `specs/ui/inspection-form.md`, `specs/ui/review-sign.md`
- Entity specs: `specs/entities/review-token.md`, `specs/entities/review.md`, `specs/entities/inspection-detail.md`
- Design mockup: `specs/ui/designs/reviews.pen`

## Changes

### Schema Changes

**File:** `src/db/schema.ts`

1. **Add `review_tokens` table:**
   - `id` UUID PK (default `crypto.randomUUID()`)
   - `event_id` UUID FK → events(id), NOT NULL
   - `token` VARCHAR(64), UNIQUE, NOT NULL — cryptographically random, URL-safe
   - `customer_email` VARCHAR(255), NOT NULL
   - `expires_at` TIMESTAMP, NOT NULL — 90 days from creation
   - `used_at` TIMESTAMP, nullable
   - `created_at` TIMESTAMP, default `now()`, NOT NULL

2. **Add `review_token_id` to `reviews` table:**
   - `review_token_id` UUID FK → review_tokens(id), UNIQUE, nullable

3. **Make `reviewer_identifier` nullable** on `reviews` table (already nullable in current schema — verify).

4. **Add `customer_email` to `inspection_details` table:**
   - `customer_email` VARCHAR(255), nullable

5. **Run migration:** `npx drizzle-kit generate` then `npx drizzle-kit push` (or `npm run db:push`).

### Service Layer

#### New File: `src/lib/services/review-token.ts`

- **`generateToken(eventId: string, customerEmail: string): Promise<ReviewToken>`** — Creates a ReviewToken record with a 48-char cryptographically random base64url token, expires_at = now + 90 days. Called post-signing.
- **`validateToken(token: string): Promise<TokenValidationResult>`** — Looks up token, checks existence/expiry/usage. Returns `{ status: 'valid' | 'invalid' | 'expired' | 'used', reviewToken?, existingReview?, context? }`. Context includes event, vehicle, node, findings aggregation.

#### Modified File: `src/lib/services/review.ts`

- **`submitTokenReview(token: string, matchRating: MatchRating, comment?: string): Promise<Review>`** — New function. Validates the token (`SELECT ... FOR UPDATE`), checks exists/expired/used, then in a single transaction: inserts review with `review_token_id` + updates token `used_at = now()`. Throws typed errors for invalid/expired/used tokens.
- **`getReviewForEvent(eventId: string): Promise<Review | null>`** — New function. Returns the single review for an event (for report page display). Replaces multi-review aggregation in the report context since MVP has one review per report.
- **Keep `getReviewsForEvent()`** unchanged — still used for future multi-review and inspector profile aggregation.
- **Keep `getReviewsForNode()`** unchanged.

#### Modified File: `src/lib/services/inspection.ts`

- **Modify `signInspection()`** — After the signing transaction commits, check if `customer_email` is present on InspectionDetail. If so: (1) call `reviewToken.generateToken()`, (2) call `email.sendInspectionSignedEmail()`. Both are best-effort, outside the signing transaction. Log and swallow email failures.
- **Modify `createInspection()` / `CreateInspectionParams`** — Accept optional `customerEmail: string` parameter. Pass it through to InspectionDetail creation.

#### New File: `src/lib/services/email.ts`

- **`sendInspectionSignedEmail(params): Promise<void>`** — Sends transactional email via Resend with React Email template. Params include: to, vehicleName, plate, vin, inspectorName, eventDate, findingsSummary, reportUrl, reviewUrl. Best-effort — catches and logs errors.

### Server Actions / API

#### Modified File: `src/lib/actions/review.ts`

- **Add `submitTokenReviewAction({ token, matchRating, comment })`** — Public (no auth required). Validates with `submitTokenReviewSchema`. Calls `review.submitTokenReview()`. Returns `{ success, data?, error? }`.
- **Keep existing `submitReviewAction()`** as-is for backward compatibility, but it will no longer be called from any UI. Can be removed in a follow-up.

#### Modified File: `src/lib/actions/inspection.ts`

- **Modify `createInspectionAction()`** — Accept `customerEmail` in params. Pass to service. Note: the `createInspectionSchema` in validators.ts must also be updated.
- **Add `updateCustomerEmailAction({ eventId, customerEmail })`** — New action for updating the customer email on the sign page. Validates email format. Only works on draft events (immutability guard). Updates `inspection_details.customer_email`.

### Validators

**File:** `src/lib/validators.ts`

- **Add `submitTokenReviewSchema`:**
  ```typescript
  z.object({
    token: z.string().min(1, "Token inválido."),
    matchRating: z.enum(["yes", "partially", "no"]),
    comment: z.string().max(500).optional().or(z.literal("")),
  })
  ```
- **Modify `createInspectionSchema`** — Add `customerEmail: z.string().email().optional().or(z.literal(""))`.
- **Add `updateCustomerEmailSchema`:**
  ```typescript
  z.object({
    eventId: z.string().uuid(),
    customerEmail: z.string().email("Ingresá un email válido.").optional().or(z.literal("")),
  })
  ```

### Components / UI

#### New File: `src/app/(public)/review/[token]/page.tsx`

Server component. The dedicated review page at `/review/{token}`.
- On load: calls `reviewToken.validateToken(token)`.
- Based on result status, renders one of:
  - `valid` → `<ReviewPageForm>` with inspection context + form
  - `invalid` → Error page: "Enlace inválido"
  - `expired` → Error page: "Enlace expirado" + report link
  - `used` → Read-only view: "Ya dejaste una reseña" + previous review card + report link

#### New File: `src/components/review/review-page-form.tsx`

Client component (`"use client"`). The review form for the dedicated `/review/{token}` page.
- Renders: inspection context card (vehicle, date, inspector, status summary, report link), review question, three rating radio cards with status colors, comment textarea (auto-expanding, 500 char limit with counter), submit button.
- On submit: calls `submitTokenReviewAction()`. On success: shows confirmation view (green checkmark, thank-you title, report link button). On error: toast.
- States: idle, rating selected (submit enabled), submitting (spinner), confirmation, error.

#### Modified File: `src/components/review/review-section.tsx`

- Remove `ReviewForm` from the section. It should now only render the read-only review display.
- Since MVP has one review per report, simplify: show a single review card under "Reseña del comprador" (if exists). Remove distribution bar and "Ver todas" link.
- If no review exists: render nothing (section hidden).

#### Modified File: `src/components/review/review-list.tsx`

- Keep as-is (still used on inspector profile for multi-review aggregation).

#### Modified File: `src/app/dashboard/inspect/metadata/page.tsx`

- Add customer email input field after the date input.
- Label: "Email del cliente (opcional)". Type: email. Placeholder: "comprador@email.com".
- Help text below: "Se le enviará el informe y un enlace para dejar una reseña."
- Client-side email validation (only when non-empty).
- Pass `customerEmail` to `createInspectionAction()`.

#### Modified File: `src/app/dashboard/inspect/[id]/sign/page.tsx`

- Add editable customer email field above the sign button.
- Label: "Email del cliente (opcional)". Pre-filled from InspectionDetail.customer_email if already set.
- Help text: "Se le notificará cuando firmes la inspección."
- On blur or sign: if email changed, call `updateCustomerEmailAction()` to persist before signing.
- Standard email validation (only when non-empty).

#### Modified File: `src/app/(public)/report/[slug]/page.tsx`

- Update the `ReviewSection` usage to pass only the single review (not the form).
- Remove any props related to review submission.

### Other Changes

#### New File: `src/lib/emails/inspection-signed.tsx`

React Email template for the post-signing notification email. Uses `@react-email/components`. Shows:
- VinDex logo header
- "Inspección firmada" heading
- Vehicle summary card (make, model, year, plate, VIN, inspector, date, findings summary)
- "Ver reporte completo" primary CTA button → `/report/{slug}`
- "Dejá tu reseña" section with "Dejar reseña" accent CTA button → `/review/{token}`
- "Este enlace expira en 90 días" note
- Footer with explanation text

See `specs/ui/email-templates.md` for full design spec.

#### Dependencies

- `resend` — Resend SDK for sending transactional emails
- `@react-email/components` — React Email components for email template

Install: `npm install resend @react-email/components`

#### Environment Variables

Add to `.env.example` and `.env`:
```
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@vindex.app
```

#### Seed Data

Update `src/db/seed.ts` (optional): if there are existing seeded inspections with reviews, ensure they still work with the new schema (legacy reviews have `review_token_id = null`).

## Test Plan

### Validators (`__tests__/unit/validators/`)

- `submitTokenReviewSchema`: valid passes, missing token fails, invalid matchRating fails, comment > 500 fails, empty comment passes
- `createInspectionSchema`: customerEmail valid passes, invalid email fails, empty string passes (optional)
- `updateCustomerEmailSchema`: valid email passes, invalid fails, empty string passes

### Services (`__tests__/integration/services/`)

- **`review-token.generateToken`**: Creates token with correct fields, 48 chars, URL-safe, 90-day expiry
- **`review-token.validateToken`**: Returns `valid` for good token with context; `invalid` for non-existent; `expired` for past-expiration; `used` for used token with existing review
- **`review.submitTokenReview`**: Creates review + marks token as used in one transaction; rejects expired/used/invalid tokens; handles concurrent submissions (one succeeds, other fails)
- **`review.getReviewForEvent`**: Returns single review or null
- **`inspection.signInspection` (post-signing)**: Token created when customer_email present; no token when absent; email failure doesn't affect signing
- **`email.sendInspectionSignedEmail`**: Calls Resend with correct params; handles errors gracefully

### Actions (`__tests__/integration/actions/`)

- **`submitTokenReviewAction`**: Valid submission returns `{ success: true }`; expired/used/invalid tokens return `{ success: false }`; validation errors handled
- **`createInspectionAction`**: CustomerEmail passed through and stored on InspectionDetail
- **`updateCustomerEmailAction`**: Updates customer_email on draft event; rejects signed events

### Components (`*.test.tsx` co-located)

- **Review page (valid token)**: Context card renders correctly, rating selection enables submit, character counter works, submission shows confirmation
- **Review page (error states)**: Invalid/expired/used states render correctly with appropriate messages and links
- **Review section (report page)**: Shows single review read-only when exists, hidden when no review, no form present
- **Inspection metadata (Step 2)**: Customer email field renders, validates, passes to action
- **Sign page**: Customer email field pre-filled, editable, saved before signing

### Coverage Target

≥ 80% line coverage globally, ≥ 70% per module.

## Execution Order

1. **Install dependencies** — `resend`, `@react-email/components`
2. **Schema changes** — Add `review_tokens` table, modify `reviews` table (add `review_token_id`), modify `inspection_details` (add `customer_email`). Run migration.
3. **Validators** — Add `submitTokenReviewSchema`, `updateCustomerEmailSchema`. Modify `createInspectionSchema`.
4. **Review token service** — Create `src/lib/services/review-token.ts` with `generateToken()` and `validateToken()`.
5. **Review service updates** — Add `submitTokenReview()` and `getReviewForEvent()` to `src/lib/services/review.ts`.
6. **Email template** — Create `src/lib/emails/inspection-signed.tsx`.
7. **Email service** — Create `src/lib/services/email.ts` with `sendInspectionSignedEmail()`.
8. **Inspection service updates** — Modify `createInspection()` to accept `customerEmail`. Modify `signInspection()` to generate token + send email post-signing.
9. **Server actions** — Add `submitTokenReviewAction()` to review actions. Add `updateCustomerEmailAction()` to inspection actions. Modify `createInspectionAction()`.
10. **Review page** — Create `src/app/(public)/review/[token]/page.tsx` and `src/components/review/review-page-form.tsx`.
11. **Report page updates** — Modify `ReviewSection` to show single read-only review (no form). Update report page to use new component.
12. **Inspection form (Step 2)** — Add customer email field to `src/app/dashboard/inspect/metadata/page.tsx`.
13. **Sign page** — Add customer email field to `src/app/dashboard/inspect/[id]/sign/page.tsx`.
14. **Tests** — Write tests for validators, services, actions, and components per test plan above.
15. **Verify coverage** — Run `npm run test:coverage`, ensure thresholds met.
