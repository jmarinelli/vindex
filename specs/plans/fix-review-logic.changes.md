# Changes: Fix Review Logic
GitHub Issue: #2

## SPEC
- Created `specs/entities/review-token.md` — new entity for single-use, expirable review tokens generated at signing time
- Modified `specs/entities/inspection-detail.md` — added `customer_email` column (nullable) for post-signing notification
- Modified `specs/entities/review.md` — added `review_token_id` FK (nullable, unique), made `reviewer_identifier` nullable for backward compat, updated behavior to token-based access
- Modified `specs/flows/inspection-creation.md` — added customer email input to Step 2 (metadata), updated data flow to include `customerEmail` param
- Modified `specs/flows/inspection-signing.md` — added post-signing review token generation and email sending via Resend (best-effort, outside transaction)
- Modified `specs/flows/post-purchase-review.md` — full rewrite: token-based access via `/review/{token}`, removed open form from report page, added dedicated review page flow, single-use tokens with 90-day expiry
- Created `specs/ui/review-page.md` — new dedicated review page at `/review/{token}` with token validation states (valid/expired/used/invalid), review form, and confirmation
- Created `specs/ui/email-templates.md` — email design for post-signing notification via Resend + React Email, includes report link and review CTA
- Modified `specs/ui/report-public.md` — added read-only reviews section (distribution bar + review list), removed review submission form, updated layout diagram
- Modified `specs/ui/inspection-form.md` — added customer email input to Step 2 layout and spec, updated test plan
- Modified `specs/ui/review-sign.md` — added customer email notice above sign button (info banner showing who will be notified), updated layout diagram and test plan
- Modified `specs/ui/design-system.md` — updated screen map: report page shows read-only reviews, added Review Page route
