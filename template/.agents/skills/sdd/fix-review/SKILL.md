---
name: sdd-fix-review
description: >
  Remediates a review round under .forge/specs/<feature>/reviews-NNN/ — implements fixes,
  updates the issue files, and verifies the result. Use when resolving batched review
  issues. Do not use for creating reviews or for generic coding without review files.
---

# SDD · Fix review

Resolve every valid issue in a review round, of **any** severity — low and medium are not
deferred to follow-ups.

## Input

```
.forge/specs/<feature-slug>/reviews-NNN/*.md
```

## Process

1. **Triage.** Read each issue file. Mark any genuinely invalid issue as `wontfix` with a
   one-line rationale; everything else is in scope.
2. **Fix.** Implement the change for each valid issue, following the domain skill that
   governs the touched files.
3. **Update the issue file** with status `resolved` and a note on what changed.
4. **Verify.** Run `sdd-verify` — cited output, exit 0. Re-run after every fix.

## Definition of done

- Every issue file is `resolved` or `wontfix` (with rationale).
- Verification passes with cited evidence.
- A follow-up review round (`sdd-review`) comes back clean, or the remaining items are
  explicitly accepted by the user.
