# Authoring skills

A skill is a unit of reusable agent know-how. forge ships **workflow** skills
(stack-agnostic) and a generator (`create-domain-skill`) for **domain** skills (your
stack's guardrails). This document is the by-hand reference; `create-domain-skill`
automates it.

## Anatomy

```
.agents/skills/<name>/
├─ SKILL.md            ← required
└─ references/         ← optional: templates, checklists, longer docs (loaded on demand)
```

`SKILL.md` has YAML frontmatter plus a Markdown body:

```markdown
---
name: <kebab-case-name>
description: >
  One or two sentences. This is the trigger: it tells the agent WHEN to load the
  skill. Be specific about the paths and the situations. Mention the verbs a user
  would say ("review a PR", "plan a feature").
---

# <Human title>

<The actual guidance: the pipeline, the rules, the anti-patterns, examples.>
```

## Trigger design

The `description` is everything — it is how the agent decides to load the skill.

- **Domain skills** trigger by path: "Applies to changes under `api/**` …".
- **Workflow skills** trigger by intent: "Use when the user asks to review a PR …".
- Say what should **not** trigger it when there's ambiguity (e.g. pr-review should
  not fire during normal coding).

## Body conventions

- **Lead with the pipeline.** If the skill enforces an order
  (`auth → validate → logic`), put it first and make it non-negotiable.
- **List anti-patterns explicitly.** Agents follow "NEVER do X" better than prose.
- **Reference tasks, not commands.** Write `just test`, never `npm test` — keep
  skills stack-agnostic.
- **Keep it loadable.** Long material goes in `references/` so the main file stays
  cheap to load. Link to it; don't inline it.
- **English.** Skill bodies are English for portability; the project talks to humans
  in `artifact_language`.

## Wiring the adapters

Never hand-edit `.claude/skills/` or `.github/instructions/`. After adding or
changing a skill:

```bash
just sync-adapters
```

This regenerates:
- `.claude/skills/<name>/` — a verbatim copy (Claude Code reads `SKILL.md`).
- `.github/instructions/<name>.instructions.md` — a redirect pointing back at the
  source, so Copilot resolves to the same content.

## Registering it

Add a one-line entry to `.agents/skills/README.md` (the catalog). For domain skills
that should auto-trigger by path, also note the path in the project's `AGENTS.md`
so every tool sees the mapping.

## Checklist

- [ ] `description` makes the trigger unambiguous.
- [ ] Pipeline / rules lead the body; anti-patterns are explicit.
- [ ] No stack/vendor names — tasks and variables only.
- [ ] `just sync-adapters` run; adapters regenerated.
- [ ] Catalog (`.agents/skills/README.md`) updated.
