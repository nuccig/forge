/**
 * block-controller-write.mjs — PreToolUse hook for Edit/Write/NotebookEdit.
 *
 * Reads a PreToolUse payload from stdin and emits a decision on stdout.
 *
 * Decision rule (see context.mjs):
 *   BLOCK  <=>  isRestricted()  AND  file_path is NOT in allowlist
 *   ALLOW  otherwise
 *
 * Fail-open: any exception -> ALLOW, error logged to stderr.
 * Audit: every BLOCK decision is logged to stderr (timestamp, path, tool).
 *
 * Pure Node — no external dependencies.
 */

import { isRestricted, isAllowed } from "./lib/context.mjs";

// ─── I/O helpers ──────────────────────────────────────────────────────────────

/** Read all of stdin and resolve to a string. */
export async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Emit a JSON decision on stdout. Empty object = allow (no decision key). */
function emit(decision) {
  process.stdout.write(JSON.stringify(decision) + "\n");
}

// ─── Decision logic ───────────────────────────────────────────────────────────

/**
 * Pure decision function. Evaluates the tool name and file path against the
 * current sentinel state and returns a decision object.
 *
 * Fail-open: any exception returns {} (allow) and logs to stderr.
 *
 * @param {{ toolName: string, filePath: string }} params
 * @returns {{ decision?: string, reason?: string }}
 */
export function decide({ toolName, filePath }) {
  try {
    if (!isRestricted()) return {};        // not restricted — allow.
    if (isAllowed(filePath)) return {};    // allowlisted path — allow.

    const timestamp = new Date().toISOString();
    process.stderr.write(
      `[block-controller-write] BLOCK ${timestamp} tool=${toolName} path=${filePath}\n`,
    );

    return {
      decision: "block",
      reason:
        `Controller writes are blocked in restricted mode (fg-execute-tasks active). ` +
        `Delegate the write to the implementer subagent. Path: ${filePath}`,
    };
  } catch (err) {
    process.stderr.write(
      `[block-controller-write] WARN: unexpected error — fail-open. ${err}\n`,
    );
    return {};
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let raw;
  try {
    raw = await readStdin();
  } catch (err) {
    process.stderr.write(`[block-controller-write] WARN: stdin read failed — fail-open. ${err}\n`);
    emit({});
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`[block-controller-write] WARN: malformed payload — fail-open. ${err}\n`);
    emit({});
    return;
  }

  const toolName = payload?.tool_name ?? "";
  const filePath =
    payload?.tool_input?.file_path ?? payload?.tool_input?.notebook_path ?? "";

  emit(decide({ toolName, filePath }));
}

// Only run when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("block-controller-write.mjs")) {
  main();
}
