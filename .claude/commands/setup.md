# /setup

Bootstrap the dev-workflow infrastructure for an existing project. Creates spec directories, configures backlog tracking, and ensures `CLAUDE.md` has the workflow sections.

## Input

$ARGUMENTS — optional: backlog preference (e.g. "github https://github.com/org/repo/projects/1" or "local BACKLOG.md").

## Instructions

1. **Read `CLAUDE.md`** if it exists. Check what's already configured:
   - Does it have the workflow sections (Feature Workflow, Quick Fix, Backlog)?
   - Does it reference a backlog (GitHub or local file)?
2. **Check for spec directories.** Verify if `specs/entities/`, `specs/flows/`, `specs/ui/`, `specs/plans/` exist.
3. **Ask about backlog tracking** (skip if already configured in `CLAUDE.md` or provided in arguments):
   - **GitHub Issues** — ask for the GitHub Project URL
   - **Local file** — ask for the file name (suggest `BACKLOG.md` as default)
4. **Create what's missing:**
   - Create any missing `specs/` subdirectories (`entities/`, `flows/`, `ui/`, `plans/`).
   - If `CLAUDE.md` doesn't exist, create it with the workflow sections defined in `setup.md` (the "Existing project" CLAUDE.md sections), using the backlog option the user chose.
   - If `CLAUDE.md` exists but is missing workflow sections, append them.
   - If the user chose a local backlog file and it doesn't exist, create it:
     ```markdown
     # Backlog

     <!-- Add items as checkboxes. /close will mark them done. -->
     ```
5. **Report** what was created or updated.

## Rules

- Do NOT modify existing content in `CLAUDE.md` — only append missing sections.
- Do NOT write specs, code, or implementation plans.
- Do NOT overwrite an existing backlog file.
- If everything is already set up, say so and stop.
- Keep it brief.
- End your response with: "Workflow setup complete. You can start with `/understand` for an existing feature or `/fix` for a quick change."
