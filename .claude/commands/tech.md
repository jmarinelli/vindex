# /tech

Define the technical stack, infrastructure, and engineering standards for the project. This is phase 2 of greenfield development — only run after `/start` has produced a `PROJECT.md`.

## Input

$ARGUMENTS — optional: a predefined tech stack, constraints, or preferences (e.g. "Next.js, Postgres, deploy on Vercel" or "must use Python, we already have AWS infrastructure").

## Instructions

1. **Read `PROJECT.md`** at the project root. If it doesn't exist, tell the user to run `/start` first and stop.
2. **Assess the input.**
   - If the user provided a specific stack with clear choices, confirm understanding and go to step 4.
   - If the user provided partial preferences, use them as constraints and fill gaps in step 3.
   - If no preferences were given, proceed to step 3.
3. **Propose a tech stack.** Based on the product requirements in `PROJECT.md`, suggest a complete stack. Explain your reasoning briefly — why each choice fits this specific project. Present it and ask the user for feedback. Iterate until the user approves. Cover:
   - **Language and framework**
   - **Database** (and ORM/query layer if applicable)
   - **Authentication**
   - **Hosting and deployment**
   - **CI/CD**
   - **Testing strategy** (framework, what gets tested at each layer, coverage target)
   - **Other services** as needed: file storage, email, payments, real-time, background jobs, etc.
4. **Write `TECH.md`** at the project root with the following structure:

### TECH.md structure

```markdown
# Tech Stack

## Language & Framework
What language, framework, and key libraries. Include version constraints if relevant.

## Database
Database engine, ORM or query layer, migration strategy.

## Authentication
Auth approach (self-hosted, third-party service, etc.) and session management.

## Hosting & Deployment
Where it runs, how it gets deployed (manual, CI/CD, platform-managed).

## CI/CD
Pipeline definition: what runs on push, on PR, on merge to main. Linting, type checking, tests, build.

## Testing
- **Framework:** ...
- **Strategy:** what gets tested at each layer (unit, integration, e2e)
- **Coverage target:** ...% (specify if different per layer)

## Other Services
Any additional infrastructure: file storage, email, payments, real-time, background jobs, caching, CDN, monitoring, etc. Only include what's relevant to this project.

## Architecture Notes
Key architectural decisions: monolith vs services, API style (REST, GraphQL, tRPC, server actions), folder structure conventions, state management approach, key patterns (repository pattern, service layer, etc.). Keep it brief and decision-focused.
```

5. **Run `/setup`** to bootstrap the project structure (spec directories, `CLAUDE.md`, backlog). This delegates all infrastructure setup to `/setup` — do not duplicate that work here.
6. **Present the result:**
   - Summary of tech decisions
   - The `TECH.md` contents
   - What `/setup` created

## Rules

- Do NOT revisit product decisions — those are locked in `PROJECT.md`.
- Do NOT write specs, code, or implementation plans.
- Do NOT proceed to `/breakdown` automatically.
- Suggest sensible defaults but let the user decide. Never force a technology choice.
- If the user's choices seem mismatched for the product (e.g. choosing a heavy framework for a simple CRUD app), flag it as a consideration but respect their decision.
- Keep TECH.md concise and decision-focused. It's a reference, not a tutorial.
- End your response with: "Tech stack defined. Ready to break down into specs with `/breakdown` when you are."
