# /implement

Execute an approved implementation plan. This is phase 5 of the workflow — only run after PLAN is approved. This phase typically runs in a **new conversation** to maximize available context.

## Input

$ARGUMENTS — path to the plan file (e.g. `specs/plans/push-notifications.md`), or a feature name to look up in `specs/plans/`.

## Instructions

1. **Locate and read the plan file.** If a path was given, read it. If a feature name was given, look for it in `specs/plans/`. If no argument was given, list available plans in `specs/plans/` and ask which one to implement.
2. **Read all referenced specs** listed in the plan's References section.
3. **Read `CLAUDE.md`** for project conventions, stack, and testing requirements.
4. **Execute the plan** following the Execution Order:
   - Implement each step in order.
   - Write tests alongside the code (not after).
   - Follow project conventions strictly (naming, patterns, error handling).
5. **Run the test suite** after implementation is complete.
6. **Report results:**
   - What was implemented (files created/modified)
   - Test results and coverage
   - Any deviations from the plan (and why)
   - Any issues or follow-ups discovered

## Rules

- Follow the plan exactly. If something in the plan seems wrong, flag it and ask before deviating.
- Do NOT make changes beyond the plan's scope (no drive-by refactors, no extra features).
- Do NOT proceed to CLOSE automatically.
- If tests fail, fix them before reporting.
- After reporting, remind the user that the next step is CLOSE (phase 6). If the plan file contains a `GitHub Issue:` reference, mention it so the user knows it will be closed.
- End your response with: "Implementation complete. Ready for your review. Next step after approval: `/close <feature-name>`."
