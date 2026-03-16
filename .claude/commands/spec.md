# /spec

Write or update specs for the current feature. This is phase 2 of the workflow — only run after UNDERSTAND is complete and the user has given the go-ahead.

## Input

$ARGUMENTS — optional clarifications or constraints from the user. If empty, use context from the current conversation.

## Spec Types and Structures

### Entity Spec (`specs/entities/<name>.md`)

Use when: a new DB table is needed, or an existing table changes.

Required sections:
- **Description** — one sentence, what this entity represents
- **Schema** — table name, all columns (name, type, nullable, default, constraints)
- **Relations** — foreign keys with cardinality (belongs_to, has_many, etc.)
- **Invariants** — state rules that must always hold (e.g. "once signed, no field may be updated"). These are rules about data integrity — if the rule protects the validity of the data regardless of how it got there, it belongs here.

### Flow Spec (`specs/flows/<name>.md`)

Use when: a user action, process, or background job needs to be defined.

Required sections:
- **Description** — what this flow accomplishes, in one sentence
- **Actors** — who triggers it, who is affected
- **Preconditions** — what must be true before the flow starts
- **Steps** — numbered sequence including happy path, branches, and error cases
- **Business Rules** — validation rules, rate limits, authorization requirements, edge case handling. These are rules about the process — if the rule governs whether or how an action may be performed, it belongs here.
- **Postconditions** — what is true after the flow completes successfully

### UI Spec (`specs/ui/<name>.md`)

Use when: a screen or visual component needs to be defined.

Required sections:
- **Description** — what the user sees and does on this screen
- **Layout** — shell/frame type, component hierarchy, responsive behavior (mobile-first)
- **States** — every visual state: loading, empty, error, success, partial, edge cases
- **Interactions** — what happens on tap/click/submit/swipe, navigation targets
- **Accessibility** — keyboard navigation, screen reader labels, focus management

## Instructions

1. Read existing specs in `specs/` to understand current state and conventions.
2. Determine which spec types are needed for this feature (may be one or more).
3. Write or update the relevant specs following the structures above exactly. Do NOT add issue references or tracking metadata to spec files — specs are permanent documents that outlive any single issue.
4. **Cross-reference against ALL existing specs.** Specifically check:
   - Entity conflicts: does the new/changed schema break existing relations or invariants?
   - Flow conflicts: does the new flow contradict preconditions or postconditions of existing flows?
   - UI conflicts: does the new screen reuse components in a way that conflicts with existing usage?
5. **Write a changes file** to `specs/plans/<feature-name>.changes.md` (create if it doesn't exist, append if it does). Record all files created or modified in this phase under a `## SPEC` section. Include a one-line summary of what changed in each file. If the feature has a GitHub issue, include it at the top.
6. Present a summary:
   - Files created or updated (with paths)
   - Key decisions made
   - Conflicts or dependencies flagged (if any)

## Changes file format

```markdown
# Changes: <feature-name>
GitHub Issue: #<number> (if applicable)

## SPEC
- Created/Modified `specs/flows/<name>.md` — <what changed>
- Created/Modified `specs/entities/<name>.md` — <what changed>
- Created/Modified `specs/ui/<name>.md` — <what changed>
```

## Rules

- Follow existing spec conventions in the project — match the style of existing specs.
- Do NOT write implementation plans or code.
- Do NOT proceed to the next phase automatically.
- If you find conflicts, explain them clearly and suggest resolution options.
- End your response with: "Ready to proceed to DESIGN when you are, or let me know what to adjust."
