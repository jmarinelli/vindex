# /understand

Start the UNDERSTAND phase for a feature. This is always the first step — never skip it.

## Input

$ARGUMENTS — a feature description, GitHub issue number, or issue URL.

## Instructions

1. **If a GitHub issue is referenced**, read it with `gh issue view <number>`. Extract the title, description, labels, and any linked issues.
2. **Read all related existing specs** — search `specs/flows/`, `specs/ui/`, and `specs/entities/` for anything related to this feature. Also read `specs/architecture.md` for relevant conventions.
3. **Summarize back to the user:**
   - What the feature is (in your own words, one paragraph)
   - What existing specs it touches (list files)
   - What existing code it likely affects (list key files/directories)
   - Open questions or ambiguities that need clarification
4. **Ask the user** to clarify anything ambiguous before proceeding.

## Rules

- Do NOT write any specs, code, or plans.
- Do NOT proceed to the next phase automatically.
- Keep the summary concise — bullet points, not essays.
- If no existing specs are related, say so explicitly.
- If the feature comes from a GitHub issue, note the issue number (e.g. `#42`). This number must be included in all specs and plans generated for this feature so it can be tracked across conversations.
- If the feature looks simple enough that it doesn't need spec changes (bug fix, copy change, small UI tweak), suggest: "This looks like a quick fix — want to switch to `/fix`?"
- End your response with: "Ready to proceed to SPEC when you are."
