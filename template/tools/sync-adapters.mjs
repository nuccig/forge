#!/usr/bin/env node
// sync-adapters.mjs — regenerate tool adapters from the skill source of truth.
//
//   .agents/skills/<path>/SKILL.md   (canonical, edit here)
//        ├─►  .claude/skills/<path>/        verbatim copy (Claude Code reads SKILL.md)
//        └─►  .github/instructions/<name>.instructions.md   redirect stub (Copilot)
//
// Idempotent: wipes and rebuilds the adapter directories, so toggles and deletions
// always propagate. Pure Node (>= 18), no dependencies. Always exits 0 so it can run as
// the scaffolder's post-generation step without ever failing the scaffold.
//
//   node tools/sync-adapters.mjs            # verbose
//   node tools/sync-adapters.mjs --silent   # quiet (used post-generation)

import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";

const SILENT = process.argv.includes("--silent");
const ROOT = process.cwd();
const SRC = join(ROOT, ".agents", "skills");
const CLAUDE = join(ROOT, ".claude", "skills");
const GH = join(ROOT, ".github", "instructions");

const log = (msg) => { if (!SILENT) console.log(`[sync-adapters] ${msg}`); };

/** Recursively find every directory that directly contains a SKILL.md. */
function findSkillDirs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (existsSync(join(full, "SKILL.md"))) acc.push(full);
    findSkillDirs(full, acc); // nested skills (e.g. sdd/spec) are supported
  }
  return acc;
}

/** Pull `name` and the first line of `description` out of YAML frontmatter. */
function parseFrontmatter(skillFile) {
  const text = readFileSync(skillFile, "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = fm ? fm[1] : "";
  const name = (block.match(/^name:\s*(.+)$/m)?.[1] ?? "").trim();
  // description may be folded (`>`); take the first non-empty line of its value.
  let desc = "";
  const dm = block.match(/^description:\s*(.*)$/m);
  if (dm) {
    desc = dm[1].trim();
    if (desc === ">" || desc === "|" || desc === "") {
      const after = block.slice(block.indexOf(dm[0]) + dm[0].length);
      desc = (after.split(/\r?\n/).map((l) => l.trim()).find(Boolean)) ?? "";
    }
  }
  return { name, desc };
}

function main() {
  if (!existsSync(SRC)) {
    log(".agents/skills not found — nothing to sync.");
    return;
  }

  // Which adapters to generate? Key off the rendered adapter, so a project that
  // didn't ship the Claude or Copilot adapter doesn't get skill copies it never asked
  // for. AGENTS.md is universal and needs no per-skill projection.
  const doClaude = existsSync(join(ROOT, ".claude"));
  const doCopilot = existsSync(join(ROOT, ".github", "copilot-instructions.md"));

  if (!doClaude && !doCopilot) {
    log("no Claude or Copilot adapter present — skills are read from .agents/skills directly.");
    return;
  }

  // Rebuild the adapter directories we do generate (idempotent).
  if (doClaude) {
    rmSync(CLAUDE, { recursive: true, force: true });
    mkdirSync(dirname(CLAUDE), { recursive: true });
    // Mirror the ENTIRE skills tree verbatim — not just SKILL.md dirs — so shared,
    // non-skill reference dirs (e.g. sdd/references/, used by sdd-spec/plan/tasks/review
    // via ../references/) resolve identically in the adapter and in the source.
    cpSync(SRC, CLAUDE, { recursive: true });
  }
  if (doCopilot) { rmSync(GH, { recursive: true, force: true }); mkdirSync(GH, { recursive: true }); }

  const skillDirs = findSkillDirs(SRC);
  let claudeCount = doClaude ? skillDirs.length : 0;
  let ghCount = 0;

  for (const dir of skillDirs) {
    const rel = relative(SRC, dir);
    const { name, desc } = parseFrontmatter(join(dir, "SKILL.md"));

    // Redirect stub into .github/instructions/<name>.instructions.md.
    if (doCopilot) {
      const slug = name || rel.split(sep).join("-");
      const sourcePath = `.agents/skills/${rel.split(sep).join("/")}/SKILL.md`;
      const stub =
`---
applyTo: "**"
---
# ${slug}

Generated pointer — do not edit. The authoritative skill lives at
\`${sourcePath}\`. Read it for the full guidance.

> ${desc}
`;
      writeFileSync(join(GH, `${slug}.instructions.md`), stub, "utf8");
      ghCount++;
    }
  }

  const parts = [];
  if (doClaude) parts.push(`${claudeCount} skill(s) → .claude/skills`);
  if (doCopilot) parts.push(`${ghCount} stub(s) → .github/instructions`);
  log(`synced ${parts.join(", ")}`);
}

try {
  main();
} catch (err) {
  // Never fail the scaffold. Surface the problem but exit clean.
  if (!SILENT) console.error(`[sync-adapters] non-fatal: ${err?.message ?? err}`);
}
process.exit(0);
