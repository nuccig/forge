/**
 * context.mjs — shared sentinel logic for Claude Code hooks.
 *
 * Two sentinel files in .forge/ determine the hook behaviour:
 *   MARKER      — created by the `fg-execute-tasks` skill at flow start; presence = restricted mode.
 *   AGENT_FLAG  — created by the implementer subagent as its first step; presence = subagent write authorised.
 *
 * Rule (PreToolUse block-controller-write):
 *   BLOCK  <=>  marker exists  AND  agent-flag does NOT exist  AND  path outside allowlist
 *   ALLOW  otherwise
 *
 * Pure Node — no external dependencies.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MARKER = ".forge/.execute-tasks-active";
export const AGENT_FLAG = ".forge/.agent-active";

/**
 * Paths the controller may always write, even in restricted mode:
 *   - anything under .forge/ (task tracking, workflow memory, sentinels)
 *   - _tasks.md tracking files anywhere (exact filename, anchored)
 */
export const WRITE_ALLOWLIST = [
  /(^|\/)\.forge\//,
  /(^|\/)_tasks\.md$/,
];

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * True only when the marker exists AND the agent-flag does NOT exist.
 * Both paths are resolved relative to process.cwd() (project root).
 *
 * @returns {boolean}
 */
export function isRestricted() {
  const cwd = process.cwd();
  const markerExists = existsSync(resolve(cwd, MARKER));
  const agentFlagExists = existsSync(resolve(cwd, AGENT_FLAG));
  return markerExists && !agentFlagExists;
}

/**
 * True when the given path matches any allowlist pattern.
 * Normalises Windows backslashes to forward slashes before matching.
 *
 * @param {string} filePath
 * @returns {boolean}
 */
export function isAllowed(filePath) {
  const normalised = filePath.replace(/\\/g, "/");
  return WRITE_ALLOWLIST.some((pattern) => pattern.test(normalised));
}
