# /plan

Write the implementation plan for the current feature. This is phase 4 of the workflow — only run after SPEC (and DESIGN, if applicable) are approved.

## Input

$ARGUMENTS — optional constraints or scope adjustments from the user.

## Instructions

1. **Read the approved specs** — flow spec, UI spec, entity spec changes written in the SPEC phase. Also read the design mockup if one was created.
2. **Read the project conventions** — `CLAUDE.md` and `specs/architecture.md` (or equivalent) for stack, naming, patterns, and testing requirements.
3. **Write the implementation plan** with these sections:

### Plan Structure

```markdown
# Plan: <feature-name>

GitHub Issue: #<number> (if applicable — omit this line if the feature did not originate from a GitHub issue)

## Overview
One paragraph: what this plan implements and which specs it's based on.

## References
- Flow spec: `specs/flows/<name>.md`
- UI spec: `specs/ui/<name>.md`
- Entity changes: `specs/entities/<name>.md` (if applicable)
- Design mockup: `specs/ui/designs/<name>.pen` (if applicable)

## Changes

### Schema Changes
List any DB migrations, new tables, altered columns. Skip if none.

### Service Layer
Files to create or modify in the service layer. For each:
- File path
- Functions to add/modify
- Key logic (one sentence per function)

### Server Actions / API
Files to create or modify. For each:
- File path
- Actions/endpoints to add
- Input validation (reference Zod schemas)

### Components / UI
Files to create or modify. For each:
- File path
- What it renders
- Key interactions

### Other Changes
Anything else: config, utilities, migrations, seed data.

## Test Plan
What to test, organized by layer:
- Validators: ...
- Services: ...
- Actions/API: ...
- Components: ...
Expected coverage target.

## Execution Order
Numbered list of implementation steps in dependency order.
```

4. **Save the plan** to `specs/plans/<feature-name>.md`.
5. **Present a summary** of the plan — key decisions, scope, and estimated complexity.

## Rules

- The plan must be **self-contained**: a new conversation should be able to implement it by reading only this file, the specs it references, and CLAUDE.md.
- Do NOT start coding or create any source files.
- Do NOT proceed to the next phase automatically.
- List specific file paths, not vague descriptions.
- If the feature is large, suggest how to split into sub-plans.
- End your response with: "Plan saved to `specs/plans/<feature-name>.md`. Ready to implement when you are — I recommend starting a new conversation for maximum context."
