# Specs

Lightweight spec-driven development. Humans and agents read these instead of carrying the whole product in every prompt.

| File | When to read |
| --- | --- |
| `product.md` | Vision, users, non-goals |
| `architecture.md` | Stack, document model, folders |
| `phases/0N-*.md` | **Only** the phase you are implementing |

## Workflow

1. Read `AGENTS.md` Status.
2. Read the current phase spec.
3. Implement that phase only. Add tests for domain logic.
4. Run `pnpm test:run`, `pnpm lint`, `pnpm typecheck`.
5. Update `AGENTS.md` Status (`Done`, `Next`, current phase).
6. Start a new session for the next phase.

Prompt shape:

> Implement phase NN only. Read `AGENTS.md` and `specs/phases/NN-….md`. Do not start later phases. When done, update Status in `AGENTS.md`.
