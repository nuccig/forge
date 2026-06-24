---
name: sdd-spec
description: >
  Stage 1 of Spec-Driven Development. Creates a specification (what & why, no
  implementation) through interactive brainstorming with codebase and web research. Use
  when starting a new feature that carries real decisions. Do not use for technical
  design, task breakdown, or coding.
---

# SDD · Spec

Produce `spec.md` — *what* we are building and *why*. No implementation detail; that is
the plan stage's job.

## Output location

```
.forge/specs/<feature-slug>/spec.md
```

## Process

1. **Frame.** Restate the problem in one or two sentences. Confirm with the user.
2. **Brainstorm interactively.** Ask one question at a time (lean on `grill-me`). Drive
   toward: the user/job to be done, the scope boundary (what's explicitly **out**), and
   the acceptance criteria. Explore the codebase to ground answers instead of asking what
   the code already tells you.
3. **Research where it helps.** Pull prior art from the codebase and, when useful,
   external references — but the spec stays solution-agnostic.
4. **Write `spec.md`** using `references/spec-template.md`.

## Definition of done

- The spec names the problem, the users, the in/out scope, and testable acceptance
  criteria.
- It contains **no** implementation choices (no schemas, endpoints, libraries).
- The user has confirmed it before moving to the `sdd-plan` stage.

Write the spec in the project's human language; keep frontmatter and identifiers English.
