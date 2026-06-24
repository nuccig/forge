---
name: sdd-plan
description: >
  Stage 2 of Spec-Driven Development. Translates a spec into a technical design and
  records decisions as ADRs, through interactive technical clarification. Use when a spec
  exists and needs a how. Do not use for spec creation, task breakdown, or coding.
---

# SDD · Plan

Turn `spec.md` into `plan.md` — *how*, technically — and capture each significant
decision as an ADR.

## Output locations

```
.forge/specs/<feature-slug>/plan.md
.forge/specs/<feature-slug>/adr/NNNN-<decision-slug>.md
```

## Process

1. **Read the spec.** Do not re-open settled scope; if the spec is ambiguous, return to
   `sdd-spec`.
2. **Design.** Lay out the components, data shapes, contracts, and integration points.
   Reference **tasks** (`just test`, …) not literal stack commands.
3. **Clarify trade-offs interactively.** For each fork with no obvious winner, ask the
   user (use `decision-making`). Record the resolved choice — with the alternatives
   considered and the consequences — as an ADR using `references/adr-template.md`.
4. **Write `plan.md`** using `references/plan-template.md`, linking each ADR.

## Definition of done

- Every component and contract in scope has a design.
- Each non-obvious decision is an ADR (status `accepted`), linked from `plan.md`.
- Risks and the verification approach are stated.
- The user has confirmed before moving to the `sdd-tasks` stage.
