# AGENTS.md — forge (the template repo)

This file governs work on **forge itself** (the Copier template), not on projects
generated from it. (Generated projects get their own `AGENTS.md` from
`template/AGENTS.md.jinja`.) forge dog-foods the standard it ships.

## What this repo is

A Copier template that scaffolds a tool-agnostic agent harness. The deliverable is
**`template/`**; `copier.yml` defines the scaffold questions. Keep everything in
`template/` free of any specific stack, vendor, or business domain — that is the
whole point.

## Layout

| Path | Role |
| --- | --- |
| `copier.yml` | Scaffold questions, exclusions, post-gen tasks. Root only. |
| `template/` | Rendered into new projects. `*.jinja` files are templated; others are copied verbatim. |
| `template/.agents/skills/` | **Source of truth** for skills. Edit here only. |
| `template/.claude/`, `template/.github/` | Generated adapters. Do not hand-author skill content here. |
| `template/tools/sync-adapters.mjs` | Rebuilds adapters from `.agents/skills/`. |
| `docs/` | forge's own documentation (not shipped into projects). |

## Rules

- **One source for skills.** New or changed skill content goes in
  `template/.agents/skills/<skill>/SKILL.md`. The `.claude/` and `.github/`
  adapters are produced by `sync-adapters.mjs`; never edit them by hand.
- **No stack leakage.** No `npm`, `pytest`, `supabase`, framework names, or domain
  language in `template/`. Reference **tasks** (`just test`) and Copier variables
  (`{{ ... }}`) instead.
- **English in skills.** Skill bodies and `AGENTS.md` are English for portability.
  The generated project's human-facing language is the `artifact_language` variable.
- **Version every output-affecting change.** Update `CHANGELOG.md` and bump the
  SemVer tag so `copier update` produces a clean diff downstream.
- **Validate the render.** Before claiming done, run a throwaway render
  (`copier copy . /tmp/forge-check --defaults --trust`) and the hook unit tests.

## Build / check tasks

This repo has no compiled stack; "build" means *render and verify*:

```bash
copier copy . ./.render-test --defaults --trust   # render with defaults
node template/.claude/hooks/__tests__/run.mjs      # hook unit tests (pure Node)
```

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …).
- Jinja in templated files uses Copier variables from `copier.yml`; keep defaults
  sensible so `--defaults` renders cleanly.
- Markdown skills follow the Anthropic convention: a `SKILL.md` with YAML
  frontmatter (`name`, `description`) plus optional `references/`.
