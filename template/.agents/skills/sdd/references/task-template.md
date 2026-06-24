---
id: <NNN>
title: <Task title>
status: pending      # pending | in_progress | done
depends_on: []       # task ids that must land first (Serial Locks)
created: <YYYY-MM-DD>
---

# Task <NNN> — <title>

## Goal

<One sentence: what this task delivers.>

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `<path>`
- `<path>`

## Governing skill

<The domain skill whose trigger path matches these files, or "none".>

## Steps

1. <…>
2. <…>

## Acceptance check

- [ ] <The concrete check that proves this task is done.>

## Context

<Patterns to follow, gotchas, links to spec/plan/ADR sections.>
