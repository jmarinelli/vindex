# Plan: Wording Revamp

GitHub Issue: #7

## Overview

Replace all user-facing copy across the platform to align with the voice & tone principles
defined in `specs/ui/voice-and-tone.md`. The core changes are: (1) "inspector" → "verificador",
(2) "inspección" → "verificación" (the service), (3) remove VinDex as verification authority
("Verificado por/en VinDex" → "Registrado en VinDex"), (4) "firma digital" / "firmado
digitalmente" → "inspección firmada" / "firmado", (5) "sellado/anclado al VIN" → "vinculado al
VIN". No schema, logic, or architectural changes — copy only.

## References

- Voice & tone guide: `specs/ui/voice-and-tone.md`
- Copy audit (all before/after strings): `specs/ui/copy-audit.md`
- Updated UI specs: `report-public.md`, `inspector-profile.md`, `landing.md`, `design-system.md`,
  `dashboard.md`, `review-sign.md`, `inspection-form.md`

## Changes

### Schema Changes

None. No database columns, enum values, or migration changes.

### Service Layer

Error messages and email copy that appear in user-facing contexts.

#### `src/lib/services/inspection.ts`
- "inspección" → "verificación" in all thrown Error messages:
  - "No se puede modificar una inspección firmada." → "No se puede modificar una verificación firmada."
  - "No tenés permiso para crear inspecciones en este nodo." → "No tenés permiso para crear verificaciones en este nodo."
  - "La inspección no fue encontrada." → "La verificación no fue encontrada."
  - "Esta inspección ya fue firmada." → "Esta verificación ya fue firmada."
  - "Solo se pueden firmar inspecciones." → "Solo se pueden firmar verificaciones."
  - "No tenés permisos para firmar esta inspección." → "No tenés permisos para firmar esta verificación."
  - "La inspección no tiene detalle asociado." → "La verificación no tiene detalle asociado."
  - "Solo se pueden corregir inspecciones firmadas." → "Solo se pueden corregir verificaciones firmadas."
  - "Solo se pueden corregir inspecciones." → "Solo se pueden corregir verificaciones."
  - "No tenés permisos para corregir esta inspección." → "No tenés permisos para corregir esta verificación."
  - "La inspección no tiene detalle asociado." (correction path) → same
- `signerName` fallback: `"Inspector"` → `"Verificador"` (2 occurrences)
- `inspectorName` variable name can stay (internal, not user-facing)

#### `src/lib/services/review.ts`
- "La inspección no fue encontrada." → "La verificación no fue encontrada."
- "Solo se pueden dejar reseñas en inspecciones firmadas." → "Solo se pueden dejar reseñas en verificaciones firmadas."
- "Ya dejaste una reseña para esta inspección. Podés dejar otra en 24 horas." → "…esta verificación…"

#### `src/lib/actions/inspection.ts`
- "Error al crear la inspección." → "Error al crear la verificación."
- "Error al firmar la inspección." → "Error al firmar la verificación."
- "Error al obtener las inspecciones." → "Error al obtener las verificaciones."
- "Inspección no encontrada." → "Verificación no encontrada."
- "Inspección firmada no encontrada." → "Verificación firmada no encontrada."
- "Error al obtener la inspección." → "Error al obtener la verificación."
- "No se puede modificar una inspección firmada." → "No se puede modificar una verificación firmada."

#### `src/lib/validators.ts`
- "Tipo de inspección inválido." → "Tipo de verificación inválido."
- "ID de inspección inválido." → "ID de verificación inválido." (4 occurrences)

#### `src/lib/emails/inspection-signed.tsx`
- Email subject: `Inspección de ${vehicleName} firmada — ${inspectorName}` → `Verificación de ${vehicleName} firmada — ${inspectorName}`
- Preview text: "Inspección de…" → "Verificación de…", "firmada por ${inspectorName}" stays
- Title: "Inspección firmada" → "Verificación firmada"
- Body: "Se firmó la inspección de tu vehículo." → "Se firmó la verificación de tu vehículo."
- "Inspector: {inspectorName}" → "Verificador: {inspectorName}"
- Footer: "un inspector de VinDex" → "un verificador de VinDex"

#### `src/lib/services/email.ts`
- `inspectorName` param name can stay (internal)
- Subject string: same as above (if duplicated here)

#### `src/lib/services/template.ts`
- Default template name: "Inspección Pre-Compra Completa" → "Verificación Pre-Compra Completa"

### Components / UI

All changes are string replacements in JSX. No logic changes.

#### `src/app/layout.tsx`
- Meta title: "VinDex — Historial vehicular verificado" → "VinDex — Historial vehicular documentado"
- Meta description: update per copy-audit Journey 1

#### `src/app/page.tsx` (Landing)
- ~15 string changes per copy-audit Journey 1 (inspector→verificador, inspección→verificación, sellado→vinculado, etc.)

#### `src/components/landing/landing-header.tsx`
- "Para inspectores" → "Para verificadores"
- Anchor href: `#inspectores` → `#verificadores`

#### `src/components/layout/shell-public.tsx`
- "Verificado en" → "Registrado en"

#### `src/components/report/verification-badge.tsx`
- "Verificación" → "Inspección firmada"

#### `src/components/report/inspector-card.tsx`
- "Inspector verificado" → "Verificador registrado"
- "Ver perfil del inspector" → "Ver perfil del verificador"

#### `src/components/report/correction-button.tsx`
- Error messages: "inspección" → "verificación" (if hardcoded here)

#### `src/components/profile/identity-card.tsx`
- "Inspector verificado" → "Verificador registrado"
- aria-label: "Inspector verificado por VinDex" → "Verificador registrado en VinDex"

#### `src/app/(public)/report/[slug]/page.tsx`
- Meta title: "Inspección" → "Verificación"
- Meta description: "verificada" → "documentada", "Inspección" → "Verificación"

#### `src/app/(public)/vehicle/[vin]/page.tsx`
- Meta title: "inspecciones" → "verificaciones"
- Meta description: "inspecciones verificadas" → "verificaciones documentadas"

#### `src/app/(public)/inspector/[slug]/page.tsx`
- Meta title: "Inspector verificado" → "Verificador registrado"
- Meta description: same replacement
- 404 title: "Inspector no encontrado" → "Verificador no encontrado"
- Stats labels: "inspecciones" → "verificaciones", "inspeccionando desde" → "verificando desde"
- Section title: "Inspecciones firmadas" → "Verificaciones firmadas"
- Empty state: "Este inspector aún no tiene inspecciones firmadas." → "Este verificador aún no tiene verificaciones firmadas."

#### `src/components/vehicle/vehicle-timeline.tsx`
- Heading: "Historial de inspecciones" → "Historial de verificaciones"
- Empty state: "inspecciones firmadas" → "verificaciones firmadas"

#### `src/app/dashboard/page.tsx`
- "+ Nueva Inspección" → "+ Nueva Verificación"
- "Mis Inspecciones" → "Mis Verificaciones"
- Empty/no-results states: "inspecciones" → "verificaciones"

#### `src/app/dashboard/inspect/metadata/page.tsx` (Step 1–2)
- "Nueva Inspección" → "Nueva Verificación"
- Form labels: "Tipo de inspección" → "Tipo de verificación", "Fecha de inspección" → "Fecha de verificación"
- "Iniciar Inspección" → "Iniciar Verificación"
- Info banner: "inspección(es)" → "verificación(es)"

#### `src/app/dashboard/inspect/[id]/sign/page.tsx` (Review & Sign)
- "Revisar Inspección" → "Revisar Verificación"
- "Firmar Inspección" → "Firmar Verificación"

#### `src/app/dashboard/inspect/[id]/signed/page.tsx` (Confirmation)
- "Inspección firmada" → "Verificación firmada"

#### `public/manifest.json`
- description: "Historial vehicular verificado" → "Historial vehicular documentado"

### Other Changes

#### `src/components/landing/contact-form.tsx`
- Placeholder: "servicio de inspección" → "servicio de verificación" (if present)

#### `src/db/seed.ts`
- "Verificación de título" — already uses "verificación", no change needed
- Check for any "inspector" or "inspección" references in seed data

## Test Plan

Tests that assert on user-facing strings will need corresponding updates.

### Test files to update (string assertions)

| Test file | Strings to update |
|---|---|
| `src/app/page.test.tsx` | Landing page copy assertions (inspector→verificador, inspección→verificación, etc.) |
| `src/components/layout/shell-public.test.tsx` | "Verificado en" → "Registrado en" |
| `src/components/profile/identity-card.test.tsx` | "Inspector verificado" → "Verificador registrado", aria-label |
| `src/components/profile/stats-card.test.tsx` | "inspecciones" → "verificaciones", "inspeccionando desde" → "verificando desde" |
| `src/components/profile/report-list.test.tsx` | "Inspecciones firmadas" → "Verificaciones firmadas" |
| `src/components/vehicle/vehicle-timeline.test.tsx` | "inspecciones" → "verificaciones" |
| `src/components/inspection/inspection-list.test.tsx` | "Inspecciones" → "Verificaciones" |
| `src/app/dashboard/inspect/page.test.tsx` | "inspección" → "verificación" |
| `src/components/review/review-list.test.tsx` | Check for "inspección" assertions |
| `src/components/layout/shell-field.test.tsx` | Check for "inspección" assertions |

### Verification

After all changes:
1. Run `npm run build` — no build errors
2. Run `npm test` — all tests pass
3. Manually check: landing page, a public report, inspector profile, dashboard, create inspection flow

## Execution Order

1. **Service layer error messages** — `src/lib/services/inspection.ts`, `review.ts`, `src/lib/actions/inspection.ts`, `src/lib/validators.ts` (foundational — components may render these)
2. **Email template** — `src/lib/emails/inspection-signed.tsx`, `src/lib/services/email.ts`
3. **Default template name** — `src/lib/services/template.ts`
4. **Shared layout components** — `shell-public.tsx` (footer), `layout.tsx` (meta)
5. **Public report page** — `verification-badge.tsx`, `inspector-card.tsx`, `report/[slug]/page.tsx`
6. **Inspector profile** — `identity-card.tsx`, `inspector/[slug]/page.tsx`
7. **Vehicle history** — `vehicle-timeline.tsx`, `vehicle/[vin]/page.tsx`
8. **Dashboard** — `dashboard/page.tsx`
9. **Inspection creation flow** — `metadata/page.tsx`, `sign/page.tsx`, `signed/page.tsx`
10. **Landing page** — `page.tsx`, `landing-header.tsx`, `contact-form.tsx`
11. **PWA manifest** — `public/manifest.json`
12. **Correction flow** — `correction-button.tsx` (error messages)
13. **Update all test files** — match new strings
14. **Run full test suite** — verify green
15. **Build check** — `npm run build`
