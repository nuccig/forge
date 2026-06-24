# Changelog — forge

All notable changes to the **forge** template are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/), and the template is
versioned with [Semantic Versioning](https://semver.org/).

Downstream projects pull a specific version with `copier copy --vcs-ref vX.Y.Z`
and upgrade with `copier update`. **Bump the version on every change that affects
generated output** so `copier update` has a clear diff to merge.

## [Unreleased]

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
