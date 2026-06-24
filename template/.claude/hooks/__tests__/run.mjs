/**
 * run.mjs — pure-Node unit tests for the controller-write hook. No dependencies.
 *
 *   node .claude/hooks/__tests__/run.mjs
 *
 * Exits non-zero if any assertion fails.
 */

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { isAllowed, isRestricted, MARKER, AGENT_FLAG } from "../lib/context.mjs";
import { decide } from "../block-controller-write.mjs";

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ── Sandbox helpers ───────────────────────────────────────────────────────────
const originalCwd = process.cwd();
function withSandbox(setup, body) {
  const dir = mkdtempSync(join(tmpdir(), "forge-hook-"));
  try {
    process.chdir(dir);
    mkdirSync(join(dir, ".forge"), { recursive: true });
    setup(dir);
    body(dir);
  } finally {
    process.chdir(originalCwd);
    rmSync(dir, { recursive: true, force: true });
  }
}
const touch = (dir, rel) => writeFileSync(join(dir, rel), "");

// ── isAllowed ─────────────────────────────────────────────────────────────────
test("isAllowed: .forge paths are allowed", () => {
  assert.equal(isAllowed(".forge/specs/x/memory/state.md"), true);
  assert.equal(isAllowed(".forge/.execute-tasks-active"), true);
});
test("isAllowed: _tasks.md is allowed anywhere", () => {
  assert.equal(isAllowed("a/b/_tasks.md"), true);
  assert.equal(isAllowed("_tasks.md"), true);
});
test("isAllowed: windows separators are normalised", () => {
  assert.equal(isAllowed(".forge\\specs\\x\\plan.md"), true);
});
test("isAllowed: source files are not allowed", () => {
  assert.equal(isAllowed("src/index.ts"), false);
  assert.equal(isAllowed("app/api/users/route.ts"), false);
});

// ── isRestricted ──────────────────────────────────────────────────────────────
test("isRestricted: false with no marker", () => {
  withSandbox(() => {}, () => assert.equal(isRestricted(), false));
});
test("isRestricted: true with marker and no agent-flag", () => {
  withSandbox((dir) => touch(dir, MARKER), () => assert.equal(isRestricted(), true));
});
test("isRestricted: false when agent-flag present", () => {
  withSandbox((dir) => { touch(dir, MARKER); touch(dir, AGENT_FLAG); },
    () => assert.equal(isRestricted(), false));
});

// ── decide ────────────────────────────────────────────────────────────────────
test("decide: allows when not restricted", () => {
  withSandbox(() => {}, () => {
    assert.deepEqual(decide({ toolName: "Write", filePath: "src/x.ts" }), {});
  });
});
test("decide: blocks source write in restricted mode", () => {
  withSandbox((dir) => touch(dir, MARKER), () => {
    const d = decide({ toolName: "Write", filePath: "src/x.ts" });
    assert.equal(d.decision, "block");
    assert.match(d.reason, /restricted mode/);
  });
});
test("decide: allows allowlisted write in restricted mode", () => {
  withSandbox((dir) => touch(dir, MARKER), () => {
    assert.deepEqual(decide({ toolName: "Write", filePath: ".forge/specs/x/_tasks.md" }), {});
  });
});

// ── Runner ──────────────────────────────────────────────────────────────────
for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
}
console.log(`\n${passed}/${tests.length} passed`);
