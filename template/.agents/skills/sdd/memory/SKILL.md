---
name: sdd-memory
description: >
  Maintains workflow-scoped memory for an SDD run under .forge/specs/<feature>/memory/ —
  read, update, compact, and promote durable context across task executions. Use when a
  task spans sessions or decisions must survive individual task executions. Do not use for
  global user preferences or review remediation.
---

# SDD · Memory

Durable, feature-scoped context that survives individual task executions and sessions.
Not for trivial single-session work, and not a substitute for global preferences.

## Location

```
.forge/specs/<feature-slug>/memory/
├─ decisions.md     # choices made and why (mirrors/links ADRs)
├─ learnings.md     # surprises discovered during implementation
└─ state.md         # what's done, what's pending, current blockers
```

## When to use

- The feature spans multiple sessions.
- A decision or learning needs to outlive the task that produced it.
- A new task needs context another task discovered.

## Operations

1. **Read** the memory files at the start of each task execution.
2. **Update** them as decisions land and learnings surface — short bullets, with the
   *why*.
3. **Compact** when a file grows noisy: fold resolved items into a one-line summary, drop
   dead ends.
4. **Promote** anything that became a real architectural decision into an ADR
   (`sdd-plan`'s `adr/` directory); memory holds the working notes, ADRs hold the
   ratified record.

## Cleanup

After the feature merges, summarize the memory into the spec's final notes (or archive
the directory). Don't leave stale `state.md` claiming work is pending once it shipped.
