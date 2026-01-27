# System Patterns

*Derives from [projectbrief.md](./projectbrief.md). Captures architecture and design decisions.*

## System Architecture
- _TBD – high-level layout (e.g. monolith, services, frontend/backend split)._
- _Document once stack and structure are chosen._

## Key Technical Decisions
- **Task management:** Task Master is used for task breakdown and tracking (`.taskmaster/`, `.cursor/commands/tm/`).
- **Version control:** Git, remote `origin` → `https://github.com/tornari2/Treasury_Take_Home.git`, default branch `main`.
- _Add further decisions (e.g. APIs, data model, auth) as they are made._

## Design Patterns in Use
- _TBD – e.g. repository, service layer, composition, state management._
- _Update as patterns emerge from implementation._

## Component / Module Relationships
- _TBD – modules, packages, or services and how they depend on each other._
- _Reflect actual code layout once it exists._

## Conventions
- Memory Bank in `memory-bank/`; read at task start and update on significant change or when asked to **update memory bank**.
- Project-specific rules and workflow live in `.cursor/rules/` (e.g. `taskmaster/`, `cursor_rules.mdc`).

---
*Update when architecture or major design decisions change.*
