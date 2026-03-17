# Flow: Post-Purchase Review

*Describes how buyers leave reviews on inspection reports: token-based access, submission, and display on report and inspector profile.*
*Derived from: specs/entities/review.md | specs/entities/review-token.md | specs/entities/event.md | specs/entities/inspection-detail.md | specs/entities/node.md | specs/ui/review-page.md | specs/ui/report-public.md | specs/ui/inspector-profile.md*

---

## Overview

After purchasing a vehicle, the buyer receives an email with a link to the inspection report and a separate link to leave a review. Reviews are submitted on a dedicated review page (`/review/{token}`), not on the report page itself. The review token is single-use and expires after 90 days. Reviews are public, require no authentication, and use a single ternary question as the core signal.

The review question measures **inspection accuracy**, not service satisfaction: "¿La condición real del vehículo coincidió con lo que describió el informe de inspección?"

---

## Prerequisites

- The inspection event has `status = 'signed'`.
- A ReviewToken exists for the event (generated at signing time when customer email was provided).
- The token has not been used (`used_at` is null).
- The token has not expired (`expires_at` is in the future).

---

## Entry Point

The buyer accesses the review page via a link in the post-signing notification email:

```
https://vindex.app/review/{token}
```

This link is **not** available on the public report page. The report page shows existing reviews read-only but does not provide a way to submit new reviews.

---

## Flow Steps

### Step 1: Token Validation

When the buyer visits `/review/{token}`, the server validates the token:

1. **Token lookup:** `SELECT * FROM review_tokens WHERE token = :token`
2. **Token exists?** If not → render "Enlace inválido" error page.
3. **Token expired?** If `expires_at < now()` → render "Enlace expirado" error page.
4. **Token used?** If `used_at IS NOT NULL` → render "Reseña ya enviada" page showing the previously submitted review.
5. **Event signed?** Defensive check — if the linked event is not signed → render error page. (Should not happen since tokens are only created post-signing.)

If all checks pass, render the review form with the inspection context.

### Step 2: Review Page Context

The review page shows a summary of the inspection to remind the buyer what they're reviewing:

- Vehicle name (make, model, year)
- License plate (if present)
- Inspection date
- Inspector name (node display name)
- Status summary (e.g., "✓ 12 Bien · ⚠ 3 Atención · ✕ 1 Crítico")
- Link to the full public report: "Ver reporte completo →"

This context is loaded server-side from the event, vehicle, node, and findings data.

### Step 3: Fill Review Form

#### 3.1 The Review Question

The core of the review is a single ternary question:

**"¿La condición real del vehículo coincidió con lo que describió el informe?"**

Three options displayed as a radio button group with large touch targets:

| Value | Label | Icon | Description |
|-------|-------|------|-------------|
| `yes` | "Sí, coincidió" | ✓ | The vehicle was as described. The inspector's assessment was accurate. |
| `partially` | "Parcialmente" | ⚠ | Some findings matched, others did not. |
| `no` | "No coincidió" | ✕ | The vehicle's condition differed significantly from the report. |

- Options are displayed as full-width radio cards, 56px tall minimum.
- Unselected: white bg, `gray-200` border, `gray-600` text.
- Selected: status-colored bg tint, status-colored border (2px), status-colored text, bold.
  - `yes` → `status-good` colors
  - `partially` → `status-attention` colors
  - `no` → `status-critical` colors
- `match_rating` is **required**. The submit button is disabled until a selection is made.

#### 3.2 Comment (Optional)

- Textarea below the rating question.
- Label: "Comentario (opcional)".
- Placeholder: "Contanos tu experiencia...".
- Max length: 500 characters. Character counter shown: "{current}/500".
- Auto-expanding, minimum 2 lines.
- `text-base` (16px) to prevent iOS zoom.

#### 3.3 Submit

- "Enviar reseña" primary button, full-width.
- **Disabled** when no `match_rating` is selected.
- **Loading state** while submitting: spinner + "Enviando..." text, button disabled.
- **On success:** page transitions to confirmation view (see Step 4).
- **On error:** toast notification with error message. Form remains editable for retry.

### Step 4: Confirmation

After successful submission, the form is replaced with a confirmation view:

- Icon: checkmark in `success` color.
- Title: "¡Gracias por tu reseña!"
- Subtitle: "Tu opinión ayuda a otros compradores a tomar mejores decisiones."
- Link: "Ver reporte completo →" linking to `/report/{slug}`.
- The confirmation is static — no action buttons beyond the report link.

---

## Data Flow

### Token Validation (Page Load)

```
Buyer visits /review/{token}
  → Server component: validateReviewToken(token)
  → Service: reviewToken.validateToken(token)
    → SELECT review_tokens WHERE token = :token
    → Check: token exists → INVALID_TOKEN
    → Check: expires_at > now() → EXPIRED_TOKEN
    → Check: used_at IS NULL → ALREADY_USED (load existing review for display)
    → SELECT event WHERE id = token.event_id AND status = 'signed'
    → Check: event is signed → INVALID_STATE
    → Load context: event + vehicle + node + findings aggregation
  → Render review page with form and context
```

### Review Submission

```
Buyer fills review form on /review/{token}
  → Client validates: match_rating required, comment ≤ 500 chars
  → Server action: submitTokenReviewAction({ token, matchRating, comment })
  → Zod validation
  → Service: review.submitTokenReview(token, matchRating, comment)
    → SELECT review_tokens WHERE token = :token FOR UPDATE
    → Check: token exists → INVALID_TOKEN
    → Check: expires_at > now() → EXPIRED_TOKEN
    → Check: used_at IS NULL → ALREADY_USED
    → BEGIN TRANSACTION
      → INSERT INTO reviews (event_id, review_token_id, match_rating, comment)
      → UPDATE review_tokens SET used_at = now() WHERE id = :tokenId
    → COMMIT
  → Return { success: true, data: { review } }
```

### Report Page — Review Display (Read-Only)

```
Report page loads (server component)
  → Service: review.getReviewsForEvent(eventId)
    → SELECT * FROM reviews WHERE event_id = :eventId ORDER BY created_at DESC
  → Returns: { reviews, aggregation: { total, yesCount, partiallyCount, noCount } }
  → Render rating distribution bar + recent reviews list (no form)
```

### Inspector Profile — Review Aggregation

```
Profile page loads (server component)
  → Service: review.getReviewsForNode(nodeId)
    → SELECT r.match_rating, COUNT(*) FROM reviews r
        JOIN events e ON r.event_id = e.id
        WHERE e.node_id = :nodeId AND e.status = 'signed'
        GROUP BY r.match_rating
  → Returns: { total, yesCount, partiallyCount, noCount, matchRate }
  → Render review stat tiles + breakdown bar
```

---

## Server Action

### `submitTokenReviewAction`

**Location:** `src/lib/actions/review.ts`

**Input:**

```typescript
{
  token: string,        // the review token from the URL
  matchRating: string,  // 'yes' | 'partially' | 'no'
  comment?: string      // optional, max 500 chars
}
```

**Zod Schema:**

```typescript
const submitTokenReviewSchema = z.object({
  token: z.string().min(1, "Token inválido."),
  matchRating: z.enum(["yes", "partially", "no"], {
    error: "Seleccioná una opción válida.",
  }),
  comment: z
    .string()
    .max(500, "El comentario no puede superar los 500 caracteres.")
    .optional()
    .or(z.literal("")),
});
```

**Return Shape:**

```typescript
// Success
{ success: true, data: { review: Review } }

// Error
{ success: false, error: string }
```

---

## Service Functions

### `review.submitTokenReview`

**Location:** `src/lib/services/review.ts`

**Signature:**

```typescript
async function submitTokenReview(
  token: string,
  matchRating: "yes" | "partially" | "no",
  comment: string | undefined
): Promise<Review>
```

**Logic:**
1. Look up and lock the token (`SELECT ... FOR UPDATE`).
2. Validate: exists, not expired, not used.
3. In a single transaction: insert review + mark token as used.
4. Return created review.

### `reviewToken.validateToken`

**Location:** `src/lib/services/review-token.ts`

**Signature:**

```typescript
async function validateToken(token: string): Promise<{
  status: "valid" | "invalid" | "expired" | "used";
  reviewToken?: ReviewToken;
  existingReview?: Review;
  context?: {
    event: Event;
    vehicle: Vehicle;
    node: Node;
    findingsAggregation: { good: number; attention: number; critical: number };
  };
}>
```

### `review.getReviewsForEvent`

*(Unchanged from current implementation.)*

### `review.getReviewsForNode`

*(Unchanged from current implementation.)*

---

## Error Handling

All errors are caught at the server action level and returned as `{ success: false, error }`.

| Error Code | Message | Cause |
|-----------|---------|-------|
| `INVALID_TOKEN` | "Este enlace de reseña no es válido." | Token does not exist |
| `EXPIRED_TOKEN` | "Este enlace de reseña expiró. El plazo para dejar una reseña es de 90 días." | Token past expiration |
| `ALREADY_USED` | "Ya se dejó una reseña con este enlace." | Token already used |
| `INVALID_STATE` | "El reporte no está disponible." | Event not signed (defensive) |
| `VALIDATION_ERROR` | Zod error messages | Invalid input |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Token does not exist** | Error page: "Enlace inválido". No form rendered. |
| **Token expired** | Error page: "Este enlace expiró" with explanation that the review window was 90 days. Link to the report is still shown (report is always public). |
| **Token already used** | Page shows the previously submitted review as read-only confirmation. No form. "Ya dejaste una reseña" message. Link to report. |
| **Event not signed (defensive)** | Error page: "El reporte no está disponible." Should not happen in practice. |
| **Very long comment** | Client-side validation prevents > 500 chars. Server-side Zod rejects as well. |
| **Empty comment** | Allowed — comment is optional. Stored as `null`. |
| **Concurrent submissions with same token** | `SELECT ... FOR UPDATE` prevents race conditions. One succeeds, the other gets `ALREADY_USED`. |
| **Event with corrections** | The token is tied to the original event. Each event (original and correction) has its own independent token. |
| **Report page visited directly** | Shows existing reviews as read-only list. No submission form. No way to submit a review from the report page. |
| **XSS in comment text** | Comment rendered as plain text (not HTML). React's default escaping prevents XSS. Server-side: no HTML processing. |
| **Customer shares review link** | The link works for whoever clicks it first. Once used, subsequent visitors see the confirmation page. This is by design — one review per token. |

---

## Display: Report Page (Read-Only)

Reviews are displayed on the public report page below the findings sections. **No submission form** is present on the report page.

### Rating Distribution Bar

A horizontal segmented bar showing the distribution of all reviews for this event.

- Bar height: 8px, `radius-full`.
- Segments: proportional width, colored by rating.
  - `yes` → `status-good`
  - `partially` → `status-attention`
  - `no` → `status-critical`
- Below bar: count labels — "✓ {n} Sí · ⚠ {n} Parcial · ✕ {n} No".
- Total: "{n} reseña(s)".

### Recent Reviews List

- Sorted by `created_at` descending (newest first).
- Each review shows:
  - Rating icon (✓ / ⚠ / ✕) with status color.
  - Rating label ("Sí, coincidió" / "Parcialmente" / "No coincidió").
  - Comment text (if present). Full text, no truncation.
  - Relative timestamp: "Hace 2 días", "Hace 1 semana", etc.
- Maximum 5 reviews visible initially. If more exist: "Ver todas las reseñas ({n})" link expands the list.

### Zero Reviews

- When no reviews exist for the event:
  - Rating distribution bar and review list are **not rendered**.
  - No prompt to leave a review (the report page is clean).

---

## Display: Inspector Profile

*(Unchanged from current spec.)*

Reviews are aggregated on the inspector's public profile page (`/inspector/{slug}`).

### Review Stats (Stat Tiles)

Two stat tiles in the stats grid:

| Stat | Value | Label | Computation |
|------|-------|-------|-------------|
| Total reviews | Integer | "reseñas" | Count of all reviews across all signed events for this node |
| Match rate | Percentage | "coincidencia" | `(count of 'yes' reviews / total reviews) × 100`, rounded to nearest integer. Displayed as "{n}%" |

### Review Breakdown

Below the stat tiles (within the stats card), a compact distribution bar:

- Same horizontal segmented bar as on the report page.
- Below: "✓ {n} Sí · ⚠ {n} Parcial · ✕ {n} No".
- Hidden when total reviews = 0.

### Zero Reviews on Profile

- When the inspector has zero reviews across all events:
  - Review stat tiles are **hidden**.
  - Review breakdown is **hidden**.
  - Other stats (inspection count, operating since, etc.) remain visible if applicable.

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| Token review Zod schema | `validators.ts` | Valid submission passes · Missing `matchRating` fails · Invalid `matchRating` value fails · Comment > 500 chars fails · Empty comment passes · Missing `token` fails · Empty `token` fails · Extra fields stripped |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `validateToken` service | `services/review-token.ts` | Returns `valid` for unused unexpired token with context · Returns `invalid` for non-existent token · Returns `expired` for past-expiration token · Returns `used` for already-used token with existing review |
| `submitTokenReview` service | `services/review.ts` | Creates review and marks token as used atomically · Rejects expired token (`EXPIRED_TOKEN`) · Rejects used token (`ALREADY_USED`) · Rejects non-existent token (`INVALID_TOKEN`) · Handles empty comment (stored as `null`) · Concurrent submissions: one succeeds, other fails |
| `getReviewsForEvent` service | `services/review.ts` | Returns reviews sorted by `created_at` desc · Returns correct aggregation counts · Returns empty list and zero counts for event with no reviews · Only returns reviews for the specified event · Includes both legacy and token-based reviews |
| `getReviewsForNode` service | `services/review.ts` | Aggregates across all signed events for node · Calculates correct match rate · Returns zero counts for node with no reviews · Includes both legacy and token-based reviews |
| `submitTokenReviewAction` action | `actions/review.ts` | Valid submission returns `{ success: true, data }` · Expired token returns `{ success: false, error }` · Used token returns `{ success: false, error }` · Invalid input returns validation error · Return shape matches contract |
| Token generation (in signing) | `services/inspection.ts` | Token created when customer_email present · No token created when customer_email absent · Token has correct expiration (90 days) · Token is unique and URL-safe |
| Email sending (in signing) | `services/inspection.ts` | Email sent when customer_email present · No email sent when absent · Email failure does not affect signing result |

### Component Tests

| Component | Cases |
|-----------|-------|
| **Review page (valid token)** | Renders inspection context (vehicle, date, inspector, status summary) · Report link works · Review form renders · Submit button disabled when no rating selected · Rating selection enables submit button · Selected rating shows correct status color styling · Comment textarea renders with placeholder · Character counter updates on input · Submission shows loading state · Successful submission shows confirmation message · Error shows toast · Character limit enforced client-side |
| **Review page (expired token)** | Shows expiration message · Shows link to report · No form rendered |
| **Review page (used token)** | Shows previously submitted review · Shows "Ya dejaste una reseña" message · Shows link to report · No form rendered |
| **Review page (invalid token)** | Shows invalid link message · No form rendered |
| **Review confirmation** | Renders after successful submission · Shows checkmark icon, title, and subtitle · Shows link to full report |
| **Report page — read-only reviews** | Rating distribution bar renders with correct proportions · Recent reviews list shows newest first, max 5 with expand · Zero reviews: no bar, no list, no prompt · No submission form present |
| **Profile review stats** | Review stat tiles render with correct values · Distribution bar renders on profile · Hidden when zero reviews · Match rate percentage correct |

---

## Acceptance Criteria

- [ ] Review can only be submitted via a valid, unexpired, unused token
- [ ] Token is single-use — marked as used atomically with review creation
- [ ] Expired tokens show clear expiration message with link to report
- [ ] Used tokens show the previously submitted review
- [ ] Invalid tokens show error message
- [ ] Review form is NOT present on the public report page
- [ ] Report page displays existing reviews as read-only list
- [ ] Rating options use status colors (good/attention/critical)
- [ ] Submit button disabled until rating selected, shows loading state
- [ ] Successful submission shows confirmation message with report link
- [ ] Zero reviews on report: no bar, no list, clean page
- [ ] Review aggregation on inspector profile: total count + match rate
- [ ] Profile with zero reviews hides review stats
- [ ] Comment max length 500 chars enforced client and server side
- [ ] Reviews cannot be edited or deleted after submission
- [ ] Server action returns `{ success, data?, error? }` shape
- [ ] All error messages in Spanish
- [ ] Legacy reviews (pre-token) are preserved and displayed normally
