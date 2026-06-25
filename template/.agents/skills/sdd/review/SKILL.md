---
name: sdd-review
description: >
  Performs a code review of an SDD implementation and writes a review round directory of
  issue files that sdd-fix-review consumes. Use when reviewing implemented tasks or doing
  a quality audit. Do not use for fetching external reviews, fixing issues, or editing
  source.
---

# SDD · Review

Audit the implementation of a feature and emit a structured review round. This skill
**never edits source** — it only produces issue files.

## Output location

```
.forge/specs/<feature-slug>/reviews-NNN/
├─ 001-<slug>.md
└─ 002-<slug>.md
```

`NNN` increments per round (`reviews-001`, `reviews-002`, …).

## Process

1. **Scope.** Read the spec, plan, ADRs, and the diff under review.
2. **Review across dimensions:** correctness, security, the project's domain rules
   (the governing domain skills), tests, and clarity.
3. **Write one file per issue** using `../references/review-issue-template.md`, each with a
   severity (`critical` / `high` / `medium` / `low`), the location, the problem, and a
   suggested fix.
4. **Summarize** the round: counts per severity, and whether it blocks.

## Definition of done

- Each finding is a separate, actionable issue file with a severity and a concrete fix.
- The round is consumable by `sdd-fix-review` without further interpretation.
