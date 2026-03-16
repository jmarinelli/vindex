# /design

Create or update visual mockups for the current feature. This is phase 3 of the workflow — only run after SPEC is approved.

## Input

$ARGUMENTS — optional design direction or constraints from the user. If empty, derive from the UI spec.

## Instructions

1. **Check if this feature has UI work.** Read the UI spec written in the SPEC phase. If there is no UI spec (backend-only feature), tell the user: "This feature has no UI changes. Skip to PLAN?" and stop.
2. **Read the design system** — check if the project has a design system file (e.g. `specs/ui/design-system.md`, `specs/ui/designs/design-system.pen`, or similar). Understand existing tokens, components, and patterns.
3. **Create or update the mockup** using the project's design tooling:
   - If the project uses `.pen` files (Pencil), create/update the `.pen` mockup importing the design system.
   - If the project uses another tool, follow that convention.
   - If no design tooling exists, describe the layout in detail (component tree, spacing, responsive breakpoints) as a section in the UI spec.
4. **Append to the changes file** (`specs/plans/<feature-name>.changes.md`). Add a `## DESIGN` section listing all mockup files created or modified and what changed in each.
5. **Present what you designed** — describe the key screens/states and any design decisions.

## Rules

- Always inherit from the design system — never create one-off tokens or components.
- If a new component or token is needed, update the design system first.
- Mobile-first: design the mobile layout, then describe desktop adaptations.
- Do NOT write implementation plans or code.
- Do NOT proceed to the next phase automatically.
- End your response with: "Ready to proceed to PLAN when you are, or let me know what to adjust."
