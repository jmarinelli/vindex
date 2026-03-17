# Entity: Review Token

Single-use, expirable tokens that grant access to submit a review for a specific inspection event.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), NOT NULL |
| token | VARCHAR(64) | UNIQUE, NOT NULL — cryptographically random, URL-safe |
| customer_email | VARCHAR(255) | NOT NULL — email address the token was sent to |
| expires_at | TIMESTAMP | NOT NULL — set to 90 days from creation |
| used_at | TIMESTAMP | nullable — set when the review is submitted |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Relations

- **Belongs to:** Event (many-to-one — though in practice, one token per event per customer)
- **Has one:** Review (via `review.review_token_id`)

## Token Generation

- Token is a 48-character cryptographically random string (`crypto.randomBytes(36).toString('base64url')`).
- Generated at signing time, immediately after the event transitions to `signed`.
- Token is URL-safe (base64url encoding — no `+`, `/`, or `=`).

## Invariants

- A token can only be used once. Once `used_at` is set, the token cannot be used again.
- A token cannot be used after `expires_at` has passed.
- A token is always tied to a signed event. If the event is not signed (should not happen — tokens are created post-signing), the token is invalid.
- Tokens are not editable after creation. No field on a token may be updated except `used_at` (set exactly once, on review submission).
- Only one active (unused, unexpired) token should exist per event at any time. Creating a new token for the same event invalidates the previous one (not implemented in Phase 1 — one token per event is sufficient).

## Behavior

- **Created during signing flow.** When an inspection is signed and a customer email is present on the InspectionDetail, the system generates a review token and sends the notification email.
- **No token if no customer email.** If the inspector did not provide a customer email, no token is generated and no email is sent. The inspection is signed normally.
- **Token validation** happens at the service layer when a review is submitted via `/review/{token}`.
- **Expired tokens** return a clear error: "Este enlace de reseña expiró." The review cannot be submitted.
- **Used tokens** return: "Ya se dejó una reseña con este enlace." The review page shows the previously submitted review instead of the form.

## Example Data

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_id": "e5f6a7b8-c9d0-1234-efgh-345678901234",
  "token": "k3m9x2a7p5q8r1t4v6w0y3b8d2f5h7j0n4s6u9c1e3g",
  "customer_email": "comprador@email.com",
  "expires_at": "2026-06-15T14:32:00Z",
  "used_at": null,
  "created_at": "2026-03-17T14:32:00Z"
}
```

## Dependencies

- **Requires:** Event
- **Required by:** Review (via FK), Post-signing email flow

## Acceptance Criteria

- [ ] Token generated at signing time when customer email is present
- [ ] Token is cryptographically random, URL-safe, 48 characters
- [ ] Token is unique across all tokens
- [ ] Token expires 90 days after creation
- [ ] Used token (used_at set) cannot be reused
- [ ] Expired token cannot be used
- [ ] No token generated when customer email is absent
- [ ] Token is immutable after creation (only used_at can be set once)
