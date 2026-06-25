---
name: fg-decision-making
description: >
  Apply when a task involves design, architecture, schema, or UI-behavior decisions, or
  a choice between equivalent alternatives the user should own. Prevents assuming choices
  that belong to the user.
---

# Decision-making

When a task involves **decisions** that shape design, architecture, product behavior, or
a choice between equivalent alternatives, **ask the user** before proceeding.

## When to ask

- Technical approach (polling vs. websocket, client-side vs. server-side).
- Schema definition (nullable columns, data types, constraints).
- Feature scope (what to include vs. defer).
- UI behavior (modal vs. inline, toast vs. alert, layout).
- Performance vs. simplicity trade-offs.
- Names of tables, columns, or APIs that will be permanent.

## How to ask

- Group related questions into a single message — avoid a stream of separate prompts.
- Number the alternatives; add pros/cons when relevant.
- Be concise — the user wants to decide, not read an essay.

> I need a decision before proceeding:
>
> **How should we handle notifications for new records?**
> 1. **Polling** (check every N seconds) — simple, no extra infra.
> 2. **Realtime** (websocket) — instant, but adds complexity.

## When NOT to ask

- The answer is determined by a skill in `.agents/skills/`.
- There is a clear pattern already established in the codebase.
- The decision is trivial and easily reversible (local variable name, import order).
- A documented convention already covers it.
