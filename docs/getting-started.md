# Getting started with a forge project

The first hour after `npx @nuccig/create-forge`.

## 1. Scaffold

```bash
npx @nuccig/create-forge my-project          # or: git clone … && npm run setup -- ./my-project
cd my-project
```

Answer the prompts. The important ones:

- **`task_runner`** + the `*_cmd` answers — these wire the harness to your stack.
  You can leave them blank and fill the `justfile` afterwards.
- **`issue_tracker`** — pick `none` if you don't use one; the plan/SDD skills then
  run local-only (branch + commit + PR, no status sync).
- **toggles** — `include_sdd`, `include_pr_review_ai`, `include_hooks`.

## 2. Wire the task runner

Open the `justfile` and make the recipes real:

```make
test:       pytest -q
lint:       ruff check .
typecheck:  mypy src
build:      python -m build
```

Everything downstream — `AGENTS.md`, CI, the `verify` skill — calls these recipes,
so this is the only place your stack appears.

## 3. Sync the adapters

If you edited any skill, or just to be safe:

```bash
just sync-adapters
```

This regenerates `.claude/skills/` and `.github/instructions/` from
`.agents/skills/`. (The scaffolder already ran it once post-generation.)

## 4. Point your agent at the repo

- **Claude Code** — opens `.claude/CLAUDE.md`, which imports `AGENTS.md`. Skills in
  `.claude/skills/` auto-trigger.
- **Codex / Cursor / Gemini / Aider / Zed** — read `AGENTS.md` natively.
- **GitHub Copilot** — reads `.github/copilot-instructions.md`.

Sanity check: ask the agent "read AGENTS.md and tell me the build/test commands and
the plan workflow." It should answer from the file.

## 5. Pick a flow

| You have…                                     | Use                                                 |
| --------------------------------------------- | --------------------------------------------------- |
| A focused change (1 PR)                       | the `plan` skill — it grills you first              |
| A feature with real decisions                 | the SDD pipeline: `spec → plan → tasks → implement` |
| Generated tasks to run in parallel            | `execute-tasks`                                     |
| A PR to review                                | `pr-review`                                         |
| A recurring stack-specific pattern to enforce | `create-skill` to author a domain skill             |

## 6. Commit

```bash
git init && git add -A && git commit -m "chore: scaffold from forge"
```

## Keeping up to date

Updates are manual — the scaffolder doesn't keep a link back to forge. To adopt a newer
harness, re-run `create-forge` into a scratch directory and merge the pieces you want
(your `.agents/skills/` edits are never overwritten behind your back).
