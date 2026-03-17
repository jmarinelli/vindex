# Entity: Review

Post-purchase buyer reviews of inspection reports. Reviews measure inspection accuracy, not service satisfaction.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), NOT NULL |
| review_token_id | UUID | FK → review_tokens(id), UNIQUE, nullable — links to the token used to submit this review. Null for legacy reviews submitted before token-based access. |
| match_rating | ENUM(`yes`, `partially`, `no`) | NOT NULL |
| comment | TEXT | nullable — optional free-text comment |
| reviewer_identifier | VARCHAR(255) | nullable — pseudonymous identifier (IP hash). Used by legacy reviews for rate limiting. New token-based reviews may omit this. |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Relations

- **Belongs to:** Event (many-to-one)
- **Belongs to:** ReviewToken (one-to-one, nullable — for token-based reviews)

## The Review Question

"Did the vehicle's actual condition match what the inspection report described?"

- **`yes`** — the vehicle was as described. The inspector's assessment was accurate.
- **`partially`** — some findings matched, others did not.
- **`no`** — the vehicle's condition differed significantly from the report.

## Invariants

- A review with a `review_token_id` must reference a valid, unexpired, previously-unused token. The token's `used_at` is set atomically with the review insertion.
- **Reviews are immutable after creation.** They cannot be edited or deleted by the reviewer.
- **One review per token.** The UNIQUE constraint on `review_token_id` enforces this at the DB level.

## Behavior

- **Token-based reviews (current):** The only way to submit a new review is via a valid review token at `/review/{token}`. The token must be unused and unexpired. On submission, the review is created and the token is marked as used — atomically in one transaction.
- **Legacy reviews:** Reviews submitted before the token system was introduced have `review_token_id = NULL` and `reviewer_identifier` set to an IP hash. These are preserved as-is and displayed normally.
- **Reviews are displayed on:**
  - The public report page (read-only list below the findings) — no submission form on this page.
  - The inspector's public profile (aggregated: "Of X reviews, Y% confirmed the vehicle matched the report").
  - The dedicated review page (`/review/{token}`) — after submission, the review is shown as confirmation.
- **Review volume will be low initially.** This is expected and acceptable.

## Aggregation (computed at query time)

For inspector profiles:
- Total review count
- Breakdown: X "yes" / Y "partially" / Z "no"
- Match rate: percentage of "yes" reviews

## Example Data

```json
{
  "id": "d0e1f2a3-b4c5-6789-jklm-890123456789",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "review_token_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "match_rating": "yes",
  "comment": "El auto estaba exactamente como describía el informe. Muy detallado.",
  "reviewer_identifier": null,
  "created_at": "2026-04-15T10:00:00Z"
}
```

## Dependencies

- **Requires:** Event, ReviewToken (optional)
- **Required by:** Report Viewing flow, Inspector Profile, Review Page

## Acceptance Criteria

- [ ] Review can only be submitted via a valid review token
- [ ] Token is marked as used atomically with review creation
- [ ] UNIQUE constraint on review_token_id enforces one review per token
- [ ] Legacy reviews (review_token_id = NULL) are preserved and displayed normally
- [ ] Review displays on the public report page (read-only)
- [ ] Review aggregation displays on inspector profile
- [ ] Reviews cannot be edited or deleted after submission
- [ ] Ternary match rating is the only required field (comment is optional)
