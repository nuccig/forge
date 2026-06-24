# AGENTS.md — forge (the template repo)

This file governs work on **forge itself** (the scaffolder + template), not on projects
generated from it. (Generated projects get their own `AGENTS.md` from
`template/AGENTS.md.jinja`.) forge dog-foods the standard it ships.

## What this repo is

A Node TUI scaffolder (`npx create-forge`) plus the template it renders. The deliverable
is **`template/`**; `scripts/config.mjs` defines the scaffold questions, derived
variables, and exclusion rules; `scripts/scaffold.mjs` is the CLI and `scripts/render.mjs`
renders the tree with Nunjucks (Jinja-compatible). Keep everything in `template/` free of
any specific stack, vendor, or business domain — that is the whole point.

## Layout

| Path | Role |
| --- | --- |
| `scripts/config.mjs` | Scaffold questions, derived vars, exclusions. The single config source. |
| `scripts/scaffold.mjs` | The TUI / non-interactive CLI (the `create-forge` bin). |
| `scripts/render.mjs` | Renders `template/` → target dir (Nunjucks), strips `.jinja`. |
| `template/` | Rendered into new projects. `*.jinja` files are templated; others are copied verbatim. |
| `template/.agents/skills/` | **Source of truth** for skills. Edit here only. |
| `template/.claude/`, `template/.github/` | Generated adapters. Do not hand-author skill content here. |
| `template/tools/sync-adapters.mjs` | Rebuilds adapters from `.agents/skills/` (runs post-generation). |
| `docs/` | forge's own documentation (not shipped into projects). |

## Rules

- **One source for skills.** New or changed skill content goes in
  `template/.agents/skills/<skill>/SKILL.md`. The `.claude/` and `.github/`
  adapters are produced by `sync-adapters.mjs`; never edit them by hand.
- **No stack leakage.** No `npm`, `pytest`, framework names, or domain language in
  `template/`. Reference **tasks** (`just test`) and template variables (`{{ ... }}`).
- **One config source.** Scaffold questions, defaults, and exclusions live in
  `scripts/config.mjs`. If you add a variable, add it there *and* use it in `template/`.
- **English in skills.** Skill bodies and `AGENTS.md` are English for portability.
  The generated project's human-facing language is the `artifact_language` variable.
- **Validate the render.** Before claiming done, run a throwaway render and the hook unit
  tests (see below). Check the four `primary_agent` paths if you touched adapter gating.

## Build / check tasks

This repo has no compiled stack; "build" means *render and verify*:

```bash
npm install                                            # first time (clack + nunjucks)
node scripts/scaffold.mjs ./.render-test --defaults    # render with defaults
node .render-test/.claude/hooks/__tests__/run.mjs      # hook unit tests (pure Node)
# spot-check: settings.json is valid JSON, workflows are valid YAML
```

Non-interactive overrides: `--set key=value` (repeatable), e.g.
`node scripts/scaffold.mjs ./out --defaults --set task_runner=make --set include_sdd=false`.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
- Templated files use Nunjucks (Jinja-compatible) variables from `scripts/config.mjs`;
  keep defaults sensible so `--defaults` renders cleanly. GitHub Actions `${{ … }}` must
  be wrapped in `{% raw %}…{% endraw %}` to survive rendering.
- Markdown skills follow the Anthropic convention: a `SKILL.md` with YAML frontmatter
  (`name`, `description`) plus optional `references/`.
