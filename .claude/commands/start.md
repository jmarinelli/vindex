# /start

Define a new project from a product and functional perspective. This is the entry point for greenfield development — before any code, specs, or structure exists.

## Input

$ARGUMENTS — a project description, brief, or high-level idea. Can range from a one-liner ("a task management app") to a full product spec with use cases, target users, and scope.

## Instructions

1. **Assess the input.** If the user provided a detailed brief that covers vision, target users, core entities, core flows, and MVP scope — skip the interview and go directly to step 3. If the input is vague or incomplete, proceed to step 2.
2. **Interview the user.** Ask questions in rounds to fill in the gaps. Focus exclusively on product and functional aspects:
   - **Problem:** What problem does this solve? Why does it need to exist?
   - **Users:** Who are the target users? Are there different roles or personas?
   - **Core use cases:** What are the main things users will do? Walk through the key flows.
   - **Domain model:** What are the core concepts/entities? How do they relate?
   - **Scope:** What's in the MVP? What's explicitly out? What's "nice to have"?
   - Ask all questions for a given round at once. Do NOT ask one question at a time. Aim for 1-2 rounds max — don't over-interview.
   - After each round, summarize what you've captured and ask if anything is missing or wrong.
3. **Write `PROJECT.md`** at the project root with the following structure:

### PROJECT.md structure

```markdown
# <Project Name>

## Vision
One paragraph: what this project is, what problem it solves, who it's for.

## Users
Who uses this and what characterizes them. If there are distinct roles (admin, end user, etc.), list them with a one-line description.

## Core Entities
List the main domain objects with a one-line description each. These are NOT full entity specs — just enough to understand the domain model at a glance.

- **User** — a person with an account
- **Project** — a collection of tasks owned by a user
- ...

## Core Flows
List the main user flows with a one-line description each. Same idea — high-level, not detailed specs.

- **Sign up** — user creates an account and lands on the dashboard
- **Create project** — user creates a new project and is redirected to it
- ...

## MVP Scope

### In
- Bullet list of what the MVP includes

### Out
- Bullet list of what is deferred to post-MVP
```

4. **Present the result:**
   - Summary of what was defined
   - The `PROJECT.md` contents
   - Any assumptions made

## Rules

- Do NOT discuss technology, frameworks, databases, or infrastructure. That belongs in `/tech`.
- Do NOT write specs, code, or implementation plans.
- Do NOT proceed to `/tech` automatically.
- If the user brings up tech stack decisions, acknowledge them but say: "Let's capture that in `/tech` after we lock down the product definition."
- If the user explicitly says "no questions" or "don't ask, just generate", skip the interview and use reasonable defaults for anything not specified. Note your assumptions clearly.
- Keep PROJECT.md concise. It's a reference document, not a PRD.
- End your response with: "Project defined. Ready to define the tech stack with `/tech` when you are."
