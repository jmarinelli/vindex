# /breakdown

Decompose the project definition into executable specs and an MVP roadmap. This is phase 3 of greenfield development — only run after `/start` and `/tech` have produced `PROJECT.md` and `TECH.md`.

## Input

$ARGUMENTS — optional: focus area or constraints (e.g. "skip auth for now", "start with the API layer").

## Instructions

1. **Read `PROJECT.md` and `TECH.md`** at the project root. If either doesn't exist, tell the user which is missing and which command to run first, then stop.
2. **Read `CLAUDE.md`** for any project conventions already defined.
3. **Propose the feature list.** Based on the Core Entities, Core Flows, and MVP Scope in `PROJECT.md`, and the technical decisions in `TECH.md`, draft an ordered list of features. Present it as:

```markdown
## Proposed MVP Features

1. **Project scaffolding** — Initialize the repo, install dependencies, set up config, .gitignore, CI/CD, base project structure per TECH.md
2. **<feature-name>** — <one-line description>
3. **<feature-name>** — <one-line description>
...
```

**Ordering rules:**
- Feature #1 is always **project scaffolding** — sets up the codebase, installs dependencies, creates the base structure, .gitignore, CI/CD config, and anything else needed based on `TECH.md`.
- Order by dependency: if feature B depends on feature A's entities or flows, A comes first.
- Group related work: auth entities + auth flows + auth UI together, not scattered.
- Prefer vertical slices: each feature should produce something testable end-to-end when possible.

4. **Wait for user approval.** Present the list and ask:
   - "Does this order make sense?"
   - "Want to add, remove, reorder, or split any features?"
   - Do NOT proceed until the user approves.

5. **Generate specs for all approved features.** For each feature in the list:
   - Write the relevant entity specs to `specs/entities/`
   - Write the relevant flow specs to `specs/flows/`
   - Write the relevant UI specs to `specs/ui/`
   - Follow the exact spec structures defined in `/spec` (entity, flow, UI formats)
   - Cross-reference specs as you write them — later features reference entities created by earlier ones

6. **Write the MVP roadmap** to `specs/plans/mvp-roadmap.md`:

```markdown
# MVP Roadmap

Generated from: PROJECT.md + TECH.md

## Features

- [ ] 1. **Project scaffolding** — Initialize repo, dependencies, base structure
- [ ] 2. **<feature-name>** — <one-line description>
- [ ] 3. **<feature-name>** — <one-line description>
...

## Specs Generated

- `specs/entities/<name>.md` — <one-line summary>
- `specs/flows/<name>.md` — <one-line summary>
- `specs/ui/<name>.md` — <one-line summary>
...
```

7. **Present the result:**
   - How many specs were created (entities, flows, UI)
   - The roadmap with all features listed
   - Any decisions or assumptions made
   - Conflicts or ambiguities found during spec writing

## Rules

- Do NOT write implementation plans or code.
- Do NOT proceed to `/plan` automatically.
- Feature #1 (project scaffolding) does NOT need specs — it's derived directly from `TECH.md`.
- Follow existing spec conventions if any specs already exist.
- If a feature is too large, split it into smaller features and explain why.
- If `PROJECT.md` or `TECH.md` are missing information needed for specs, ask for clarification rather than guessing.
- End your response with: "Specs and roadmap generated. To start building, run `/plan` for the first feature: **Project scaffolding**."
