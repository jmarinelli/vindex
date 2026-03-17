# Copy Audit — Wording Revamp

Audit of all user-facing copy organized by user journey. Each change references principles from
[voice-and-tone.md](voice-and-tone.md). Only copy that needs to change is listed — unchanged
copy is omitted.

Proposed rewrites are in **Spanish (Argentine)** since that is the target language.

---

## Journey 1: Landing Page Visitor

A buyer or verificador discovers VinDex for the first time.

### Files affected
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/components/landing/landing-header.tsx`
- `specs/ui/landing.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| `layout.tsx` meta title | "VinDex — Historial vehicular verificado" | "VinDex — Historial vehicular documentado" | No "verificado" from VinDex |
| `layout.tsx` meta description | "Inspecciones vehiculares firmadas digitalmente. Historial verificable para cada VIN." | "Verificaciones vehiculares firmadas por profesionales. Historial documentado para cada VIN." | Professional is the subject; no "digitalmente" |
| `page.tsx` hero subheading | "VinDex construye identidad vehicular documentada — un servicio profesional a la vez." | "VinDex construye identidad vehicular documentada — una verificación profesional a la vez." | Use "verificación" as the service term |
| `page.tsx` the-idea body | "…VinDex cambia eso: documenta desde la fuente, con quienes lo ven y trabajan en él directamente." | "…VinDex cambia eso: documenta desde la fuente, con los profesionales que lo ven y trabajan en él directamente." | Clarify "quienes" → explicit "profesionales" |
| `page.tsx` step 1 title | "Un profesional evalúa el vehículo" | No change | Already correct |
| `page.tsx` step 1 description | "Un inspector o taller registrado evalúa el vehículo y documenta su estado real, punto por punto." | "Un verificador o taller registrado evalúa el vehículo y documenta su estado real, punto por punto." | Inspector → verificador |
| `page.tsx` step 2 title | "El resultado queda sellado al VIN" | "El resultado queda vinculado al VIN" | Sellado → vinculado |
| `page.tsx` step 2 description | "Firmado digitalmente, inmutable, anclado a la identidad del vehículo para siempre." | "Firmado, inmutable, vinculado a la identidad del vehículo para siempre." | No "digitalmente"; anclado → vinculado |
| `page.tsx` step 4 description | "Cada servicio profesional se ancla al VIN. Cuando alguien quiera saber qué pasó con ese auto, la información va a estar." | "Cada servicio profesional se vincula al VIN. Cuando alguien quiera saber qué pasó con ese auto, la información va a estar." | Ancla → vincula |
| `page.tsx` inspectors section title | "Tu herramienta, tu marca, tu historial" | No change | Already correct |
| `page.tsx` inspectors section subtitle | "Todo lo que necesitás para ofrecer inspecciones profesionales." | "Todo lo que necesitás para ofrecer verificaciones profesionales." | Inspecciones → verificaciones |
| `page.tsx` feature "Tu marca, no la nuestra" description | "Reportes white-label con tu identidad prominente. La plataforma es infraestructura invisible." | "Reportes white-label con tu identidad prominente. La plataforma queda en segundo plano." | Invisible → segundo plano |
| `page.tsx` feature "Reputación que se acumula" description | "Cada inspección construye tu perfil profesional: cantidad de inspecciones, nivel de detalle, reseñas de compradores." | "Cada verificación construye tu perfil profesional: cantidad de verificaciones, nivel de detalle, reseñas de compradores." | Inspección → verificación |
| `page.tsx` vehicle timeline body | "Inspecciones, servicios y reparaciones se anclan al VIN…" | "Verificaciones, servicios y reparaciones se vinculan al VIN…" | Both terms updated |
| `page.tsx` timeline event 1 | "Inspección pre-compra" | "Verificación pre-compra" | Term alignment |
| `page.tsx` timeline event 4 | "Inspección periódica" | "Verificación periódica" | Term alignment |
| `page.tsx` timeline meta | "Insp. Martínez" | "Verif. Martínez" | Abbreviated term |
| `page.tsx` contact section title | "¿Sos inspector?" | "¿Sos verificador?" | Inspector → verificador |
| `page.tsx` contact section subtitle | "Contactanos para empezar a usar VinDex." | No change | Already correct |
| `landing-header.tsx` nav link | "Para inspectores" | "Para verificadores" | Inspector → verificador |

### Notes
- Hero heading ("El historial que cada auto debería tener.") stays — it's product-level, no attribution issues.
- Buyers section copy stays unchanged — it already uses "profesional" and focuses on transparency/immutability.
- Trust indicator ("Identidad vehicular documentada · Inmutable · Profesional") stays.

---

## Journey 2: Buyer Viewing a Public Report

A buyer opens a shared link to an inspection report.

### Files affected
- `src/components/report/verification-badge.tsx`
- `src/components/report/inspector-card.tsx`
- `src/components/layout/shell-public.tsx`
- `src/app/(public)/report/[slug]/page.tsx`
- `specs/ui/report-public.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| `verification-badge.tsx` heading | "Verificación" | "Inspección firmada" | No "verificación" as VinDex claim |
| `shell-public.tsx` footer | "Verificado en [logo]" | "Registrado en [logo]" | Platform registers, doesn't verify |
| `inspector-card.tsx` badge text | "Inspector verificado" | "Verificador registrado" | Role + status terminology |
| `inspector-card.tsx` profile link | "Ver perfil del inspector" | "Ver perfil del verificador" | Inspector → verificador |
| `report/[slug]/page.tsx` meta title (404) | "Reporte no encontrado \| VinDex" | No change | No attribution issue |
| `report/[slug]/page.tsx` meta title | "Inspección — ${vehicleName} \| VinDex" | "Verificación — ${vehicleName} \| VinDex" | Inspección → verificación in meta |
| `report/[slug]/page.tsx` meta description | "Inspección ${typeLabel} verificada. ${good} items bien, ${attention} atención, ${critical} crítico. Firmada por ${node.displayName}." | "Verificación ${typeLabel} documentada. ${good} items bien, ${attention} atención, ${critical} crítico. Firmada por ${node.displayName}." | Verificada → documentada; inspección → verificación |

### Notes
- Verification badge subtitle ("Firmada el {date} a las {time}") stays — describes the action, not a VinDex claim.
- "por {signerName} · {nodeName}" stays — correct attribution.
- "Este reporte no puede ser modificado." stays — factual.
- Summary card, findings, photos, correction notices — no changes needed.
- `report-public.md` spec footer says "Verificado por VinDex" → must update to "Registrado en VinDex".
- `report-public.md` OG description uses "verificada" → update to "documentada".

---

## Journey 3: Buyer Viewing Vehicle History

A buyer looks up a VIN to see all linked inspections.

### Files affected
- `src/components/vehicle/vehicle-timeline.tsx`
- `src/app/(public)/vehicle/[vin]/page.tsx`
- `specs/ui/vehicle-history.md` (does not exist yet — no spec update needed)

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| `vehicle/[vin]/page.tsx` meta title | "${vehicleName} — Historial de inspecciones \| VinDex" | "${vehicleName} — Historial de verificaciones \| VinDex" | Inspecciones → verificaciones |
| `vehicle/[vin]/page.tsx` meta description | "Historial de inspecciones verificadas para VIN ${vehicle.vin}." | "Historial de verificaciones documentadas para VIN ${vehicle.vin}." | Both terms updated |
| `vehicle-timeline.tsx` heading | "Historial de inspecciones (${total})" | "Historial de verificaciones (${total})" | Inspecciones → verificaciones |
| `vehicle-timeline.tsx` empty state | "Este vehículo aún no tiene inspecciones firmadas." | "Este vehículo aún no tiene verificaciones firmadas." | Inspecciones → verificaciones |

### Notes
- Inspection type labels ("Pre-compra", "Recepción", etc.) stay — they describe the type, not the platform.
- Status summaries, photo counts, correction notices — no changes needed.

---

## Journey 4: Buyer Viewing Verificador Profile

A buyer visits a verificador's public profile.

### Files affected
- `src/components/profile/identity-card.tsx`
- `src/app/(public)/inspector/[slug]/page.tsx`
- `specs/ui/inspector-profile.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| `identity-card.tsx` badge text | "Inspector verificado" | "Verificador registrado" | Role + status terminology |
| `identity-card.tsx` aria-label | "Inspector verificado por VinDex" | "Verificador registrado en VinDex" | Same; "por" → "en" (registered *in*, not *by*) |
| `inspector/[slug]/page.tsx` meta title | "${node.displayName} — Inspector verificado \| VinDex" | "${node.displayName} — Verificador registrado \| VinDex" | Both terms updated |
| `inspector/[slug]/page.tsx` meta description | "Perfil profesional de ${node.displayName}. Inspector verificado en VinDex." | "Perfil profesional de ${node.displayName}. Verificador registrado en VinDex." | Both terms updated |
| `inspector/[slug]/page.tsx` meta title (404) | "Inspector no encontrado \| VinDex" | "Verificador no encontrado \| VinDex" | Inspector → verificador |
| `inspector/[slug]/page.tsx` 404 message | "El perfil que buscás no existe o no está disponible." | No change | Generic, no attribution issue |

### Profile stats labels to review
- "inspecciones" → "verificaciones"
- "inspeccionando desde {date}" → "verificando desde {date}"
- "Inspecciones firmadas ({count})" → "Verificaciones firmadas ({count})"

### Notes
- URL path `/inspector/[slug]` should migrate to `/pro/[slug]` — flagged as implementation decision, not copy.
- Bio, contact info, logo — no changes.

---

## Journey 5: Buyer Leaving a Review

A buyer receives a review link after purchase.

### Files affected
- `src/app/(public)/review/[token]/page.tsx` (or equivalent)
- `specs/flows/post-purchase-review.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| Review page context — status summary | "✓ {n} Bien · ⚠ {n} Atención · ✕ {n} Crítico" | No change | Status labels are neutral |
| Review page — "Ver reporte completo →" | No change | — | Neutral link text |

### Notes
- The review flow copy is already neutral — it focuses on the buyer's experience, not on VinDex attribution.
- "¿La condición real del vehículo coincidió con lo que describió el informe?" — no change needed.
- "Tu opinión ayuda a otros compradores a tomar mejores decisiones." — no change needed.
- No inspector/verificador terminology appears in the review flow's user-facing copy (the inspector name comes from data, not hardcoded labels).

---

## Journey 6: Verificador Dashboard

An authenticated verificador views their dashboard.

### Files affected
- `src/app/(dashboard)/dashboard/page.tsx` (or equivalent)
- `specs/ui/dashboard.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| New inspection button | "+ Nueva Inspección" | "+ Nueva Verificación" | Inspección → verificación |
| Inspection list heading | "Mis Inspecciones ({count})" | "Mis Verificaciones ({count})" | Same |
| Empty state heading | "No tenés inspecciones" | "No tenés verificaciones" | Same |
| Empty state body | "Creá tu primera inspección para empezar." | "Creá tu primera verificación para empezar." | Same |
| Filtered no results | "No se encontraron inspecciones con estos filtros." | "No se encontraron verificaciones con estos filtros." | Same |
| Search placeholder | "Buscar por VIN, marca, modelo..." | No change | Neutral |
| Quick link | "✎ Editor de Template" | No change | Neutral |
| Quick link | "👤 Mi Perfil Público" | No change | Neutral |
| Offline banner | "Sin conexión — solo se muestran borradores locales" | No change | Neutral |

---

## Journey 7: Verificador Creating an Inspection

The verificador creates a new inspection from start to field mode.

### Files affected
- `src/app/(dashboard)/inspection/` (various)
- `specs/ui/inspection-form.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| Step 1 top bar | "Nueva Inspección" | "Nueva Verificación" | Term alignment |
| Step 1 progress | "Paso 1 de 2 — Vehículo" | No change | Neutral |
| Step 1 info banner | "Vehículo registrado — {n} inspección(es)." | "Vehículo registrado — {n} verificación(es)." | Same |
| Step 2 top bar | "Nueva Inspección" | "Nueva Verificación" | Same |
| Step 2 progress | "Paso 2 de 2 — Datos de inspección" | "Paso 2 de 2 — Datos de verificación" | Same |
| Step 2 type label | "Tipo de inspección" | "Tipo de verificación" | Same |
| Step 2 date label | "Fecha de inspección" | "Fecha de verificación" | Same |
| Step 2 start button | "Iniciar Inspección" | "Iniciar Verificación" | Same |
| Step 2 loading button | "Creando..." | No change | Neutral |
| Step 2 customer email help | "Se le enviará el informe y un enlace para dejar una reseña." | No change | Neutral |

### Notes
- Field mode (step 3) has no copy that needs changing — item names come from templates, status
  labels are neutral ("Bien", "Atención", "Crítico"), and section names are domain-specific.
- Sync indicator labels ("Guardado", "Sincronizando...", etc.) — no change.
- VIN lookup messages — no change, they reference the vehicle, not the service type.

---

## Journey 8: Verificador Reviewing & Signing

The verificador reviews findings and signs the inspection.

### Files affected
- `src/app/(dashboard)/inspection/[id]/review/` (or equivalent)
- `specs/ui/review-sign.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| Top bar | "Revisar Inspección" | "Revisar Verificación" | Term alignment |
| Sign button | "Firmar Inspección" | "Firmar Verificación" | Same |
| Loading button | "Firmando..." | No change | Neutral |
| Upload message | "Subiendo {n} foto(s)... Esperá a que termine la subida para firmar." | No change | Neutral |

### Notes
- Vehicle summary, status counts, section headers, finding rows — all neutral, no changes.
- Connectivity messages — neutral, no changes.

---

## Journey 9: Post-Sign Confirmation

The verificador sees the confirmation after signing.

### Files affected
- `src/app/(dashboard)/inspection/[id]/review/` (confirmation view)
- `specs/ui/review-sign.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| Confirmation title | "Inspección firmada" | "Verificación firmada" | Term alignment |
| Confirmation timestamp | "Firmada el {date} a las {time}" | No change | Neutral — describes action |
| Confirmation signed by | "por {user_name}" | No change | Correct attribution |

### Notes
- Report link card, share button, navigation buttons — all neutral.

---

## Journey 10: PWA & System

App-level copy that appears across contexts.

### Files affected
- `public/manifest.json`
- `src/components/pwa/install-prompt.tsx`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| `manifest.json` description | "Historial vehicular verificado" | "Historial vehicular documentado" | No "verificado" from VinDex |
| `install-prompt.tsx` heading | "Instalar VinDex" | No change | Neutral |
| `install-prompt.tsx` body | "Agregá la app a tu pantalla de inicio para acceso rápido y uso offline." | No change | Neutral |

---

## Journey 11: Correction Flow

A verificador creates a correction for a signed report.

### Files affected
- `src/components/report/correction-notice.tsx`
- `specs/flows/correction-flow.md`

### Changes

| Location | Before | After | Principle |
|---|---|---|---|
| Correction button | "Crear corrección" | No change | Neutral |
| Confirmation dialog message | "Se creará un nuevo borrador vinculado a este reporte. El reporte original no será modificado." | No change | Neutral |
| Error: not node member | "No tenés permisos para corregir esta inspección." | "No tenés permisos para corregir esta verificación." | Term alignment |
| Error: draft event | "Solo se pueden corregir inspecciones firmadas." | "Solo se pueden corregir verificaciones firmadas." | Same |
| Error: not inspection | "Solo se pueden corregir inspecciones." | "Solo se pueden corregir verificaciones." | Same |
| Error: not found | "La inspección no fue encontrada." | "La verificación no fue encontrada." | Same |

### Notes
- Correction notice banners ("Se ha emitido una corrección…", "Este reporte corrige…") — no change, they reference the report, not the service type.

---

## Summary of Changes by Category

### Terminology replacements (mechanical, high volume)
- "inspección/inspecciones" → "verificación/verificaciones" (in user-facing copy)
- "inspector/inspectores" → "verificador/verificadores"

### Attribution replacements (high impact, low volume)
- "Verificado en [logo]" → "Registrado en [logo]"
- "Verificación" (badge) → "Inspección firmada"
- "Inspector verificado" → "Verificador registrado"
- "verificada" (meta descriptions) → "documentada"
- "verificado" (meta titles) → "documentado"
- "firmado digitalmente" → "firmado"

### Tone adjustments (landing page)
- "sellado/anclado al VIN" → "vinculado al VIN"
- "infraestructura invisible" → "queda en segundo plano"

### No changes needed
- Status labels (Bien, Atención, Crítico, N/E)
- Form field labels (VIN, Patente, Kilometraje, etc.)
- Inspection type labels (Pre-compra, Recepción, Periódica, Otra)
- Requested-by labels (Comprador, Vendedor, Agencia, Otro)
- Review flow copy (already neutral)
- Sync/connectivity messages
- Photo-related copy
- Dashboard structural labels (Borrador, Firmados, etc.)
