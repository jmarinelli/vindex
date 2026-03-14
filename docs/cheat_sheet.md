Entonces el flujo integrado sería:

Escribir el flow spec (.md en specs/flows/)
Escribir el UI spec (.md en specs/ui/)
Diseñar en Pencil (.pen en specs/ui/designs/) — valida visualmente lo que dice el .md
Implementar — usando el .pen como referencia visual y el .md como spec funcional
Review — comparar resultado real vs .pen

---

Implementá Phase 2 basándote en:
- specs/flows/inspection-creation.md -> spec general de la fase
- specs/ui/inspection-form.md -> como spec funcional de la UI
- specs/ui/designs/field-mode.pen -> como referencia visual

Phase 1 ya está implementada. Seguí las convenciones de specs/architecture.md.

---

Ejecutá el paso de specs de Phase 4A (Dashboard) según specs/implementation-plan.md:

1. Escribí el flow spec: specs/flows/xxx.md
2. Escribí el UI spec: specs/ui/xxx.md
3. Diseñá el mockup en specs/ui/designs/xxx.pen (importando specs/ui/designs/design-system.pen)

Usá como referencia de formato los specs (.md) y mockups (.pen) que existen en la carpeta specs

Consultá specs/implementation-plan.md (Phase 4A), specs/architecture.md y specs/entities/ para el contenido y cualquier otra documentación referenciada en CLAUDE.md

NO implementes código. Solo generá specs y mockup.