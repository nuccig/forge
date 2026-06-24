# Changelog — forge

All notable changes to the **forge** template are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/), and the template is
versioned with [Semantic Versioning](https://semver.org/).

Projects are scaffolded with `npx create-forge`. Updates are manual (re-scaffold and
merge); bump the version on changes that affect generated output.

## [Unreleased]

### Changed
- Replaced the Copier (Python) delivery with a **Node TUI scaffolder**
  (`npx create-forge` / `git clone && npm run setup`). Zero Python; the template still
  renders with Jinja-compatible syntax (Nunjucks). Trade-off: no automatic `copier
  update` — updates are manual.

### Added
- Initial harness extraction.
  - Canonical `AGENTS.md` contract + per-tool adapters (`.claude/`, `.github/`).
  - Task-runner seam (`justfile`) decoupling skills/CI from any stack.
  - Curated skills: `plan`, `grill-me`, `execute-tasks`, `decision-making`,
    `pr-review`, `create-skill`.
  - SDD pipeline (`sdd/`): `spec → plan → tasks → implement → review → fix-review
    → verify → memory`, vocabulary aligned to GitHub Spec Kit.
  - Optional Claude Code controller-write guard hook (Node, fail-open, tested).
  - CI/CD workflows driven by task-runner recipes; optional AI PR-review workflow.
  - `tools/sync-adapters.mjs` — single source (`.agents/skills/`) → tool adapters.
  - Repo hygiene: `SECURITY.md`, `CODEOWNERS`, issue/PR templates, ADR log,
    `.editorconfig`.

[Unreleased]: https://github.com/nuccig/forge/commits/main
