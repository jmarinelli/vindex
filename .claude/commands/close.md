# /close

Close out a completed feature. This is phase 6 of the workflow — only run after IMPLEMENT is reviewed and approved by the user.

## Input

$ARGUMENTS — optional: the feature name or plan file path.

## Instructions

1. **Identify the feature** from arguments or the current conversation context.
2. **Read the plan file** (`specs/plans/<feature-name>.md`) to check for a `GitHub Issue:` reference.
3. **Close the GitHub issue** (if one is referenced in the plan file) using `gh issue close <number>`.
4. **Delete transient files** from `specs/plans/`:
   - `specs/plans/<feature-name>.md` (the plan)
   - `specs/plans/<feature-name>.changes.md` (the changes log)
   The specs and code are the permanent artifacts; plan and changes were transient handoff documents.
5. **Report** what was closed and cleaned up.

## Rules

- Do NOT delete specs — only the plan file.
- Do NOT make any code changes.
- If `gh` CLI is not available or the issue close fails, tell the user to close it manually and provide the issue number.
- If there is no GitHub issue referenced, skip step 3.
- Keep it brief.
