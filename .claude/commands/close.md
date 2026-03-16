# /close

Close out a completed feature. This is phase 6 of the workflow — only run after IMPLEMENT is reviewed and approved by the user.

## Input

$ARGUMENTS — optional: the feature name or plan file path.

## Instructions

1. **Identify the feature** from arguments or the current conversation context.
2. **Read the plan file** (`specs/plans/<feature-name>.md`) to check for a `GitHub Issue:` reference.
3. **Close the GitHub issue** (if one is referenced in the plan file) using `gh issue close <number>`.
4. **Delete the plan file** from `specs/plans/<feature-name>.md` — the specs and code are the permanent artifacts, the plan was a transient handoff document.
5. **Report** what was closed and cleaned up.

## Rules

- Do NOT delete specs — only the plan file.
- Do NOT make any code changes.
- If `gh` CLI is not available or the issue close fails, tell the user to close it manually and provide the issue number.
- If there is no GitHub issue referenced, skip step 3.
- Keep it brief.
