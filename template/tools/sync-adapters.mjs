#!/usr/bin/env node
// sync-adapters.mjs — regenerate tool adapters from the skill source of truth.
//
//   .agents/skills/<path>/SKILL.md   (canonical, edit here)
//        ├─►  .claude/skills/<path>/        verbatim copy (Claude Code reads SKILL.md)
//        └─►  .github/instructions/<name>.instructions.md   redirect stub (Copilot)
//
// Idempotent: wipes and rebuilds the adapter directories, so toggles and deletions
// always propagate. Pure Node (>= 18), no dependencies. Always exits 0 so it can run as
// a Copier post-generation task without ever failing the scaffold.
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

  // Rebuild adapter directories from scratch (idempotent).
  rmSync(CLAUDE, { recursive: true, force: true });
  rmSync(GH, { recursive: true, force: true });
  mkdirSync(CLAUDE, { recursive: true });
  mkdirSync(GH, { recursive: true });

  const skillDirs = findSkillDirs(SRC);
  let claudeCount = 0;
  let ghCount = 0;

  for (const dir of skillDirs) {
    const rel = relative(SRC, dir);

    // 1. Verbatim copy into .claude/skills/<rel> (SKILL.md + references/).
    const dest = join(CLAUDE, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(dir, dest, { recursive: true });
    claudeCount++;

    // 2. Redirect stub into .github/instructions/<name>.instructions.md.
    const { name, desc } = parseFrontmatter(join(dir, "SKILL.md"));
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

  log(`synced ${claudeCount} skill(s) → .claude/skills, ${ghCount} stub(s) → .github/instructions`);
}

try {
  main();
} catch (err) {
  // Never fail the scaffold. Surface the problem but exit clean.
  if (!SILENT) console.error(`[sync-adapters] non-fatal: ${err?.message ?? err}`);
}
process.exit(0);
