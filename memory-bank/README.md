# Memory Bank

Cursor’s persistent project context. **Read ALL core files at the start of EVERY task.**

## Hierarchy

```
projectbrief.md  ──┬──► productContext.md ──┐
                  ├──► systemPatterns.md ───┼──► activeContext.md ──► progress.md
                  └──► techContext.md ──────┘
```

## Core Files (Required)

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| **projectbrief.md**   | Scope, goals, requirements – source of truth       |
| **productContext.md** | Why the project exists, problems solved, UX goals  |
| **systemPatterns.md** | Architecture, technical decisions, design patterns |
| **techContext.md**    | Stack, dev setup, constraints, dependencies        |
| **activeContext.md**  | Current focus, recent changes, next steps          |
| **progress.md**       | What works, what’s left, status, known issues      |

## When to Update

- After significant implementation or design decisions
- When asked to **update memory bank** (review every file; prioritize activeContext and progress)
- When scope, product, or tech context changes

## Relation to Rules

Project intelligence is also stored in `.cursor/rules/` (e.g. patterns, conventions, workflow). Memory Bank holds narrative context; rules hold reusable instructions and globs.
