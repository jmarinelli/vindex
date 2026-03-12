# Entity: Review

Post-purchase buyer reviews of inspection reports. Reviews measure inspection accuracy, not service satisfaction.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| event_id | UUID | FK → events(id), NOT NULL |
| match_rating | ENUM(`yes`, `partially`, `no`) | NOT NULL |
| comment | TEXT | nullable — optional free-text comment |
| reviewer_identifier | VARCHAR(255) | NOT NULL — pseudonymous identifier (email hash or token-based) |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## The Review Question

"Did the vehicle's actual condition match what the inspection report described?"

- **`yes`** — the vehicle was as described. The inspector's assessment was accurate.
- **`partially`** — some findings matched, others did not.
- **`no`** — the vehicle's condition differed significantly from the report.

## Behavior

- **No authentication required.** The system uses a lightweight verification mechanism to prevent spam:
  - Option A: a review token embedded in the report URL (e.g., `/report/{slug}?review={token}`). The token is generated at signing time and included when the inspector shares the link.
  - Option B: email-based verification. The reviewer enters an email, receives a confirmation link.
  - Phase 1 implementation: start with rate limiting (1 review per event per IP per 24h) + simple captcha. Upgrade to token/email if spam becomes an issue.
- **Reviews are linked to specific inspection events**, not to inspectors generally.
- **Reviews are displayed on:**
  - The inspection report page (below the findings).
  - The inspector's public profile (aggregated: "Of X reviews, Y% confirmed the vehicle matched the report").
- **Review volume will be low initially.** This is expected and acceptable.
- **Reviews cannot be edited or deleted by the reviewer** after submission.

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
  "match_rating": "yes",
  "comment": "El auto estaba exactamente como describía el informe. Muy detallado.",
  "reviewer_identifier": "sha256:reviewer@email.com",
  "created_at": "2026-04-15T10:00:00Z"
}
```

## Dependencies

- **Requires:** Event
- **Required by:** Report Viewing flow, Inspector Profile

## Acceptance Criteria

- [ ] Review can be submitted without creating an account
- [ ] Rate limiting prevents spam (1 review per event per IP per 24h)
- [ ] Review displays on the inspection report page
- [ ] Review aggregation displays on inspector profile
- [ ] Reviews cannot be edited or deleted after submission
- [ ] Ternary match rating is the only required field (comment is optional)
