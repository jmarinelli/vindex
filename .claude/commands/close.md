# /close

Close out a completed feature. This is phase 6 of the workflow — only run after IMPLEMENT is reviewed and approved by the user.

## Input

$ARGUMENTS — optional: the feature name or plan file path.

## Instructions

1. **Identify the feature** from arguments or the current conversation context.
2. **Read the plan file** (`specs/plans/<feature-name>.md`) to check for a `GitHub Issue:` reference.
3. **Close the tracking item** (if applicable):
   - **GitHub Issue:** if the plan file references a GitHub issue, close it with `gh issue close <number>`.
   - **Local backlog:** if `CLAUDE.md` references a local backlog file (e.g. `BACKLOG.md`), read it and mark the matching item's checkbox as done (`- [x]`).
   - If neither applies, skip this step.
4. **Delete transient files** from `specs/plans/`:
   - `specs/plans/<feature-name>.md` (the plan)
   - `specs/plans/<feature-name>.changes.md` (the changes log)
   The specs and code are the permanent artifacts; plan and changes were transient handoff documents.
5. **Update the MVP roadmap** (if applicable). Check if `specs/plans/mvp-roadmap.md` exists AND the completed feature is listed in it. If both conditions are true, mark the feature's checkbox as done (`- [x]`). If this was the last unchecked feature, mention that the MVP is complete. If the feature is not in the roadmap (e.g. post-MVP iterative work), skip this step entirely.
6. **Report** what was closed and cleaned up.

## Rules

- Do NOT delete specs — only the plan file.
- Do NOT delete `specs/plans/mvp-roadmap.md` — it is a permanent tracking document, not a transient plan.
- Do NOT make any code changes.
- If `gh` CLI is not available or the issue close fails, tell the user to close it manually and provide the issue number.
- Keep it brief.
