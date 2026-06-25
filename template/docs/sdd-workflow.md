# Spec-Driven Development (SDD)

The SDD pipeline turns a fuzzy idea into reviewed, merged code through four named
stages, each producing a durable artifact. It mirrors the
[GitHub Spec Kit](https://github.com/github/spec-kit) vocabulary so the flow is
familiar across tools.

```
spec ──► plan ──► tasks ──► implement
 │        │         │            │
 │        │         │            └─ fg-execute-tasks runs them (parallel, one PR)
 │        │         └─ tasks/NNN-*.md   (independently implementable units)
 │        └─ plan.md                    (technical design, ADRs)
 └─ spec.md                             (what & why — no implementation)
```

Use SDD when a change carries **real architectural decisions** or spans multiple PRs.
For a focused 1-PR change, skip straight to the **fg-plan** skill.

## Stages

| Stage | Skill | Produces | Question it answers |
| --- | --- | --- | --- |
| Spec | `sdd/spec` | `spec.md` | *What* are we building and *why*? (no code) |
| Plan | `sdd/plan` | `plan.md` + ADRs | *How*, technically? What are the trade-offs? |
| Tasks | `sdd/tasks` | `tasks/NNN-*.md` | What are the independent, executable units? |
| Implement | `sdd/implement` | code + PRs | Build it, verified, reviewed. |

Supporting skills: `sdd/review` (review round), `sdd/fix-review` (remediation),
`sdd/verify` (fresh evidence before any "done"), `sdd/memory` (durable context across
task executions).

## The artifact tree

Each feature gets a directory. Artifacts are written in the project's human language
(`artifact_language`); frontmatter, enums, and identifiers stay English.

```
.forge/specs/<feature-slug>/
├─ spec.md
├─ plan.md
├─ adr/0001-<decision>.md
├─ tasks/
│  ├─ 001-<slug>.md
│  └─ 002-<slug>.md
├─ reviews-001/        # a review round (review skill) → fix-review consumes it
└─ memory/             # workflow-scoped durable context
```

## Running it

1. **`sdd/spec`** — interactive; grills you on scope, non-goals, acceptance.
2. **`sdd/plan`** — turns the spec into a technical design; records decisions as ADRs.
3. **`sdd/tasks`** — decomposes the plan into self-contained task files.
4. **`fg-execute-tasks`** — runs the task files (see `docs/` on parallelism); opens one
   integration PR.
5. **`sdd/review`** → **`sdd/fix-review`** — review round and remediation.
6. **`sdd/verify`** — refuses any "done" without fresh verification evidence.

## Anti-patterns

- Writing implementation detail in `spec.md` — that belongs in `plan.md`.
- Tasks that depend on each other's uncommitted edits — they must be independently
  implementable.
- Claiming completion without running `verify` tasks and citing the output.
