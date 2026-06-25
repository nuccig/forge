# forge architecture

Three design decisions carry the whole harness. This document explains *why* they
are the way they are, so you can extend forge without breaking its portability.

## 1. `AGENTS.md` is canonical; tools get adapters

`AGENTS.md` is the cross-tool standard, stewarded by the Linux Foundation's Agentic
AI Foundation and read natively by Codex, Cursor, Copilot, Gemini, Aider, Zed, and
others. Claude Code is the notable exception: it reads `CLAUDE.md` and
`.claude/skills/`, not `AGENTS.md`.

forge resolves this by making `AGENTS.md` the **single source of truth** and
generating thin adapters:

- `.claude/CLAUDE.md` — first line is `@AGENTS.md` (an import), then Claude-only
  extras (hooks, subagents). Nothing is duplicated.
- `.github/copilot-instructions.md` — points Copilot at `AGENTS.md`.

**Why not symlink?** Symlinks are fragile on Windows and in zip distribution. forge
uses an explicit, cross-platform **generator** (`tools/sync-adapters.mjs`) instead.

## 2. Skills live once; adapters are generated

Skills are the reusable units of agent know-how. Their source of truth is
`.agents/skills/<skill>/SKILL.md` (the emerging tool-neutral convention). A single
command propagates them:

```
.agents/skills/<skill>/SKILL.md
   ├─►  .claude/skills/<skill>/SKILL.md          (verbatim — Claude reads SKILL.md)
   └─►  .github/instructions/<skill>.instructions.md   (redirect stub for Copilot)
```

`sync-adapters.mjs` is **idempotent**: it wipes and rebuilds the adapter
directories from the source, so toggles (`include_sdd`, …) and deletions always
propagate. Run it via `just sync-adapters`, or let the scaffolder run it post-generation.

This mirrors a pattern many teams arrive at independently: one neutral directory,
many tool-specific projections.

## 3. The task-runner seam decouples from the stack

Skills and CI must not know whether you use `npm`, `pytest`, or `go test`. They
call **tasks**:

```
AGENTS.md / ci.yml / verify skill   ──►  just lint | just typecheck | just test | just build
                                              │
                                         justfile  ──►  the real, stack-specific commands
```

The `justfile` is the only file that names your stack. Swap it (or choose
`make`/`npm`) and the harness follows unchanged. This is what lets the *same* skill
set serve a Python service and a TypeScript app.

## Putting it together

```
            EDIT HERE                 GENERATED / DERIVED
        ┌────────────────┐
        │  AGENTS.md     │──────────► .claude/CLAUDE.md  (import)
        │  (canonical)   │──────────► .github/copilot-instructions.md  (pointer)
        └────────────────┘
        ┌────────────────┐
        │ .agents/skills │──sync────► .claude/skills/  +  .github/instructions/
        └────────────────┘
        ┌────────────────┐
        │  justfile      │◄──called── ci.yml, verify skill, AGENTS.md
        └────────────────┘
```

## Extending forge

- **New tool surface** → add an adapter writer in `sync-adapters.mjs`. Source
  unchanged.
- **New workflow skill** → add `.agents/skills/<name>/SKILL.md`, sync.
- **New domain skill (per project)** → use the `create-domain-skill` skill; it does the
  above for you, seeds the skill from the project's ADRs, and grills you for trigger paths
  and the mandatory pipeline. The flows (`plan`, `execute-tasks`, `sdd-plan`, `sdd-tasks`)
  propose it when a new domain appears.
- **Stack change** → edit the `justfile`. Nothing else.

The invariant to preserve: **nothing project-specific lives in `template/`**, and
**skills are never edited in an adapter directory.**
