---
name: sdd-tasks
description: >
  Stage 3 of Spec-Driven Development. Decomposes a spec and plan into detailed,
  independently implementable task files enriched with codebase context. Use when a plan
  exists and needs an executable breakdown. Do not use for spec/plan creation or coding.
---

# SDD · Tasks

Decompose `plan.md` into numbered task files that `fg-execute-tasks` (or the `fg-plan` skill)
can run.

## Output location

```
.forge/specs/<feature-slug>/tasks/NNN-<slug>.md
```

## Process

1. **Read spec + plan + ADRs.**
2. **Slice into independent units.** Each task is self-contained and **independently
   implementable** — it must not depend on another task's uncommitted edits. Where order
   is unavoidable (schema → API → UI), state the dependency explicitly so the executor
   serializes it (a Serial Lock).
3. **Declare disjoint file scope.** For each task, list the files it owns. Disjoint
   scopes are what let `fg-execute-tasks` run tasks in parallel.
4. **Enrich.** Explore the codebase and add the concrete context each task needs:
   patterns to follow, the domain skill that governs its files, acceptance checks. When a
   task's files have **no** governing domain skill, flag the gap and recommend authoring one
   with **`fg-create-domain-skill`** (seeded by the feature's ADRs) before or alongside it.
5. **Write each task** using `../references/task-template.md`, numbered `001`, `002`, ….

## Definition of done

- Tasks are independent (or their dependencies are explicit Serial Locks).
- Each task names its file scope, its governing domain skill, and its acceptance check.
- The set fully covers the plan — no gaps, no overlap.
