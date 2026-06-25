---
name: fg-plan
description: >
  Full task-planning flow — create a branch, explore the codebase, design the solution,
  wait for approval, execute, verify, commit, and open a PR. Use when the user asks to
  plan, implement, or start any non-trivial feature, fix, or refactor.
tools: Agent, Bash, Read, Glob, Grep, Write, Edit
---

# fg-plan agent

This agent is a thin wrapper over the **`fg-plan` skill**, which is the source of truth for
the workflow. Load and follow `.claude/skills/fg-plan/SKILL.md` step by step:

1. Scale check — confirm this is a single-PR change; otherwise escalate to the SDD pipeline.
2. Grill the plan (mandatory) via the `fg-grill-me` skill.
3. Branch → explore (subagent) → design (subagent) → present and **wait for approval**.
4. Execute, following the domain skill governing each file.
5. Verify with cited evidence (the task-runner `verify` recipe). No "should pass".
6. Commit (Conventional Commits) → push → open the PR from the template.

Do not duplicate the skill's content here — read it and execute it. Talk to the user in the
project's human language; write code and commits in English.
