# Flow: Post-Purchase Review

*Describes how buyers leave reviews on inspection reports: access, submission, spam prevention, and display on report and inspector profile.*
*Derived from: specs/entities/review.md | specs/entities/event.md | specs/entities/node.md | specs/ui/report-public.md | specs/ui/inspector-profile.md | specs/implementation-plan.md (Phase 5B)*

---

## Overview

After purchasing a vehicle, the buyer can leave a review on the inspection report to indicate whether the vehicle's actual condition matched what the report described. Reviews are public, require no authentication, and use a single ternary question as the core signal. They are displayed on the report page and aggregated on the inspector's public profile.

The review question measures **inspection accuracy**, not service satisfaction: "¿La condición real del vehículo coincidió con lo que describió el informe de inspección?"

---

## Prerequisites

- The inspection event has `status = 'signed'` (only signed reports accept reviews).
- The public report page is accessible at `/report/{slug}`.
- No authentication is required to submit a review.

---

## Entry Point

- On the public report page (`/report/{slug}`), below the findings sections, a "Dejar una reseña" section is visible.
- The section is always visible on signed reports — it does not require a special token or link.

---

## Flow Steps

### Step 1: Access Review Form

The review form is embedded directly on the public report page, below all findings sections and above the footer. It is not a separate page or modal.

#### 1.1 Form Visibility

- The form is visible to all visitors on signed report pages.
- If the visitor has already submitted a review for this event (detected via rate limiting — same IP within 24h), the form is replaced with a "Ya dejaste una reseña" message.
- Draft report pages (404) do not show the form.

### Step 2: Fill Review Form

#### 2.1 The Review Question

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

#### 2.2 Comment (Optional)

- Textarea below the rating question.
- Label: "Comentario (opcional)".
- Placeholder: "Contanos tu experiencia...".
- Max length: 500 characters. Character counter shown: "{current}/500".
- Auto-expanding, minimum 2 lines.
- `text-base` (16px) to prevent iOS zoom.

#### 2.3 Submit

- "Enviar reseña" primary button, full-width.
- **Disabled** when no `match_rating` is selected.
- **Loading state** while submitting: spinner + "Enviando..." text, button disabled.
- **On success:** form replaced with success confirmation (see Step 3).
- **On error:** toast notification with error message. Form remains editable for retry.

### Step 3: Confirmation

After successful submission, the form area is replaced with a confirmation message:

- Icon: checkmark in `success` color.
- Title: "¡Gracias por tu reseña!"
- Subtitle: "Tu opinión ayuda a otros compradores a tomar mejores decisiones."
- The confirmation is static — no action buttons. The visitor can continue browsing the report or navigate away.

---

## Spam Prevention

### Rate Limiting (Phase 1 Implementation)

- **1 review per event per IP per 24 hours.**
- Rate limiting is enforced at the server action level.
- If a visitor attempts to submit a second review for the same event within 24h:
  - The server action returns `{ success: false, error: "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas." }`.
  - The form shows the error via toast.

### Reviewer Identifier

- The `reviewer_identifier` column stores a pseudonymous identifier.
- Phase 1 implementation: hash of the client IP address (`sha256(ip)`).
- This is used for rate limit enforcement and basic duplicate detection, not for display.

### Future Upgrade Path

If spam becomes an issue post-MVP:
- **Option A:** Review token embedded in the shared URL (inspector shares `/report/{slug}?review={token}`). Token generated at signing time.
- **Option B:** Email-based verification. Reviewer enters an email, receives a confirmation link.
- These upgrades do not change the review entity schema or UI — they only add an access gate.

---

## Display: Report Page

Reviews are displayed on the public report page, below the review submission form (or below the confirmation message after submitting).

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
  - Only the submission form is visible with a subtle prompt: "Sé el primero en dejar una reseña."

---

## Display: Inspector Profile

Reviews are aggregated on the inspector's public profile page (`/inspector/{slug}`), extending the stats section from Phase 4B.

### Review Stats (New Stat Tiles)

Two new stat tiles are added to the stats grid:

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

## Data Flow

### Review Submission

```
Visitor fills review form on /report/{slug}
  → Client validates: match_rating required, comment ≤ 500 chars
  → Server action: submitReviewAction({ eventId, matchRating, comment })
  → Zod validation
  → Service: review.submitReview(eventId, matchRating, comment, reviewerIdentifier)
    → SELECT event WHERE id = :eventId AND status = 'signed'
    → Check: event exists and is signed → NOT_FOUND / INVALID_STATE
    → Rate limit check: SELECT review WHERE event_id = :eventId AND reviewer_identifier = :identifier AND created_at > now() - 24h
    → Check: no existing review → RATE_LIMITED
    → INSERT INTO reviews (event_id, match_rating, comment, reviewer_identifier)
  → Return { success: true, data: { review } }
```

### Report Page — Review Display

```
Report page loads (server component)
  → Service: review.getReviewsForEvent(eventId)
    → SELECT * FROM reviews WHERE event_id = :eventId ORDER BY created_at DESC
  → Returns: { reviews, aggregation: { total, yesCount, partiallyCount, noCount } }
  → Render rating distribution bar + recent reviews list
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

### `submitReviewAction`

**Location:** `src/lib/actions/review.ts`

**Input:**

```typescript
{
  eventId: string,      // UUID of the signed event
  matchRating: string,  // 'yes' | 'partially' | 'no'
  comment?: string      // optional, max 500 chars
}
```

**Zod Schema:**

```typescript
const submitReviewSchema = z.object({
  eventId: z.string().uuid("ID de inspección inválido."),
  matchRating: z.enum(["yes", "partially", "no"], {
    required_error: "Seleccioná una opción.",
    invalid_type_error: "Opción inválida.",
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

### `review.submitReview`

**Location:** `src/lib/services/review.ts`

**Signature:**

```typescript
async function submitReview(
  eventId: string,
  matchRating: "yes" | "partially" | "no",
  comment: string | undefined,
  reviewerIdentifier: string
): Promise<Review>
```

**Logic:**
1. Validate event exists and is signed.
2. Check rate limit (1 per event per identifier per 24h).
3. Insert review record.
4. Return created review.

### `review.getReviewsForEvent`

**Location:** `src/lib/services/review.ts`

**Signature:**

```typescript
async function getReviewsForEvent(eventId: string): Promise<{
  reviews: Review[];
  aggregation: { total: number; yesCount: number; partiallyCount: number; noCount: number };
}>
```

### `review.getReviewsForNode`

**Location:** `src/lib/services/review.ts`

**Signature:**

```typescript
async function getReviewsForNode(nodeId: string): Promise<{
  total: number;
  yesCount: number;
  partiallyCount: number;
  noCount: number;
  matchRate: number; // percentage 0-100
}>
```

---

## Error Handling

All errors are caught at the server action level and returned as `{ success: false, error }`.

| Error Code | Message | Cause |
|-----------|---------|-------|
| `NOT_FOUND` | "La inspección no fue encontrada." | Event does not exist |
| `INVALID_STATE` | "Solo se pueden dejar reseñas en inspecciones firmadas." | Event is not signed |
| `RATE_LIMITED` | "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas." | Rate limit exceeded |
| `VALIDATION_ERROR` | Zod error messages | Invalid input |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Draft report** | Report page returns 404. No review form visible. |
| **Visitor already reviewed (same IP, same event, < 24h)** | Form shows. On submit, server returns rate limit error. Toast displayed. |
| **Visitor reviews after 24h** | New review is accepted. Both reviews exist for the event. Multiple reviews per event per IP are allowed if separated by 24h. |
| **Very long comment** | Client-side validation prevents > 500 chars. Server-side Zod rejects as well. |
| **Empty comment** | Allowed — comment is optional. Stored as `null`. |
| **Multiple reviews from different IPs** | All accepted. Distribution bar and list show all reviews. |
| **Event with corrections** | Each event (original and correction) has its own independent reviews. Reviews are not shared between them. |
| **Inspector has events across multiple nodes** | Not applicable in Phase 1 (one user, one node). Profile aggregation queries by `node_id`. |
| **Concurrent submissions from same IP** | Race condition possible but low risk. Worst case: 2 reviews from same IP within 24h. Acceptable for MVP. |
| **Report page with many reviews** | First 5 shown, "Ver todas" expands. No pagination — full list loads on expand. Acceptable for MVP volume. |
| **Review on report with zero findings** | Allowed. The review question is about accuracy, which applies even to minimal reports. |
| **XSS in comment text** | Comment rendered as plain text (not HTML). React's default escaping prevents XSS. Server-side: no HTML processing. |

---

## Test Plan

Per `specs/architecture.md §5` — coverage target ≥ 80%.

### Unit Tests

| Target | File | Cases |
|--------|------|-------|
| Review Zod schema | `validators.ts` | Valid submission passes · Missing `matchRating` fails · Invalid `matchRating` value fails · Comment > 500 chars fails · Empty comment passes · Missing `eventId` fails · Invalid UUID format fails · Extra fields stripped |

### Integration Tests

| Target | File | Cases |
|--------|------|-------|
| `submitReview` service | `services/review.ts` | Creates review for signed event · Rejects review on draft event (`INVALID_STATE`) · Rejects review on non-existent event (`NOT_FOUND`) · Rejects duplicate within 24h (`RATE_LIMITED`) · Allows review after 24h · Stores `reviewer_identifier` correctly · Handles empty comment (stored as `null`) |
| `getReviewsForEvent` service | `services/review.ts` | Returns reviews sorted by `created_at` desc · Returns correct aggregation counts · Returns empty list and zero counts for event with no reviews · Only returns reviews for the specified event |
| `getReviewsForNode` service | `services/review.ts` | Aggregates across all signed events for node · Calculates correct match rate · Returns zero counts for node with no reviews · Excludes reviews on draft events (should not exist, but defensive) |
| `submitReviewAction` action | `actions/review.ts` | Valid submission returns `{ success: true, data }` · Rate-limited submission returns `{ success: false, error }` · Invalid input returns validation error · Return shape matches contract |

### Component Tests

| Component | Cases |
|-----------|-------|
| **Review form** | Renders on signed report page · Submit button disabled when no rating selected · Rating selection enables submit button · Selected rating shows correct status color styling · Comment textarea renders with placeholder · Character counter updates on input · Submission shows loading state · Successful submission shows confirmation message · Error shows toast · Character limit enforced client-side |
| **Review confirmation** | Renders after successful submission · Shows checkmark icon, title, and subtitle · No action buttons |
| **Rating distribution bar** | Renders proportional segments with correct colors · Shows count labels below · Handles all-yes (single segment), mixed, and all-no distributions · Hidden when zero reviews |
| **Recent reviews list** | Renders reviews newest-first · Shows rating icon + label + comment + timestamp · Handles reviews without comments · "Ver todas" shown when > 5 reviews · Expand loads remaining reviews · Hidden when zero reviews |
| **Zero reviews state** | Form visible with "Sé el primero" prompt · No distribution bar · No review list |
| **Profile review stats** | Review stat tiles render with correct values · Distribution bar renders on profile · Hidden when zero reviews · Match rate percentage correct |

---

## Acceptance Criteria

- [ ] Review form visible on signed report pages, no auth required
- [ ] Ternary match rating is the only required field (comment is optional)
- [ ] Rating options use status colors (good/attention/critical)
- [ ] Submit button disabled until rating selected, shows loading state
- [ ] Successful submission shows confirmation message replacing the form
- [ ] Rate limiting: 1 review per event per IP per 24h
- [ ] Rate limit error shown via toast with descriptive message
- [ ] Rating distribution bar displays on report page with correct proportions
- [ ] Recent reviews list shows on report page, newest first, max 5 with expand
- [ ] Zero reviews: form visible with prompt, no bar or list
- [ ] Review aggregation on inspector profile: total count + match rate
- [ ] Review breakdown bar on inspector profile
- [ ] Profile with zero reviews hides review stats
- [ ] Comment max length 500 chars enforced client and server side
- [ ] Reviews cannot be edited or deleted after submission
- [ ] Server action returns `{ success, data?, error? }` shape
- [ ] All error messages in Spanish
