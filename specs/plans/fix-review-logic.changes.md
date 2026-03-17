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

## DESIGN
- Modified `specs/ui/designs/reviews.pen` — **Report Reviews (Mobile & Desktop)**: removed review submission form, distribution bar, counts row, and "Ver todas" link. Now shows a single read-only review under "Reseña del comprador" (one review per report in current MVP)
- Modified `specs/ui/designs/reviews.pen` — **Review Page — Form (Mobile)**: new standalone page at `/review/{token}` with VinDex top bar, inspection context card (vehicle, date, inspector, status summary, report link), rating radio cards (Sí/Parcialmente/No with status colors), comment textarea with character counter, and primary submit button
- Modified `specs/ui/designs/reviews.pen` — **Review Page — Confirmation (Mobile)**: success state with green checkmark circle, thank-you title, subtitle, and "Ver reporte completo" primary button
- Modified `specs/ui/designs/reviews.pen` — **Review Page — Invalid Token**: error state with red ✕ circle, "Enlace inválido" title, message, ghost "Ir al inicio" CTA
- Modified `specs/ui/designs/reviews.pen` — **Review Page — Expired Token**: warning state with clock icon in amber circle, "Enlace expirado" title, message, "Ver reporte →" link
- Modified `specs/ui/designs/reviews.pen` — **Review Page — Already Used**: success state with green checkmark, "Ya dejaste una reseña" title, read-only review card showing previous rating/comment/timestamp, "Ver reporte completo" primary button
- Modified `specs/ui/designs/reviews.pen` — **Customer Email — Sign + Step 2**: Sign page shows editable email field ("Email del cliente (opcional)") above the "Firmar Inspección" button so the inspector can set or correct the email before signing; Step 2 shows the same email input with help text ("Se le enviará el informe y un enlace para dejar una reseña.")
- Created `specs/ui/designs/emails.pen` — **Inspection Signed Email**: full email mockup at 600px width with gray-50 background, white content card. Sections: VINdex logo, "Inspección firmada" heading, vehicle summary card (name, plate, VIN, inspector, date, findings result), "Ver reporte completo" dark CTA button, "Dejá tu reseña" section with accent "Dejar reseña" button and 90-day expiry note, footer with platform branding and explanation text
