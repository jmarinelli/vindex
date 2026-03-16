# /fix

Quick fix for small, well-scoped changes that don't require spec updates. Use `/understand` instead for features that need new or modified specs.

## Input

$ARGUMENTS — a description, GitHub issue number, or issue URL.

## Instructions

1. **If a GitHub issue is referenced**, read it with `gh issue view <number>`.
2. **Assess complexity.** If the change appears to require new or modified specs (new entities, new flows, UI spec changes, schema changes), tell the user: "This looks like it needs specs — want to switch to `/understand`?" and stop.
3. **Clarify ambiguities.** If anything is unclear, ask before proceeding.
4. **Read the relevant code** — identify the files that need to change.
5. **Propose the change:**
   - What you'll do (one paragraph)
   - Which files you'll modify
   - Any risks or side effects
6. **Wait for the user's confirmation** before writing any code.
7. **Implement the fix** following project conventions (`CLAUDE.md`). Write or update tests as needed.
8. **Report results:**
   - What was changed (files modified)
   - Test results
   - Suggested commit message (include `fixes #N` if a GitHub issue exists)
9. **Wait for the user's review.** If there is a GitHub issue, ask: "Want me to close #N?"

## Rules

- Do NOT create specs, plan files, or changes files.
- Do NOT modify existing specs.
- If you discover the change is more complex than expected during step 4, stop and suggest switching to `/understand`.
- Follow project conventions strictly (naming, patterns, error handling, testing).
- One confirmation checkpoint (step 6) before coding — do not skip it.
- Keep it concise. This is meant to be fast.
