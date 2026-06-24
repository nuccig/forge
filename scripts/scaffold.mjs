#!/usr/bin/env node
// scaffold.mjs — interactive (TUI) and non-interactive scaffolder for forge.
//
//   npx @nuccig/create-forge my-app                 # TUI
//   npm run setup -- my-app                  # TUI (from a clone)
//   node scripts/scaffold.mjs my-app --defaults
//   node scripts/scaffold.mjs my-app --defaults --set task_runner=make --set include_sdd=false
//
// Renders template/ into the target dir, then runs sync-adapters. No Python, no Copier.

import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as p from "@clack/prompts";

import { questions, groups, computeContext, slugify } from "./config.mjs";
import { renderTree } from "./render.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const TEMPLATE_DIR = join(ROOT, "template");

// ─── Arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { target: null, defaults: false, force: false, set: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--defaults" || a === "-y") opts.defaults = true;
    else if (a === "--force" || a === "-f") opts.force = true;
    else if (a === "--out" || a === "-o") opts.target = argv[++i];
    else if (a === "--set") {
      const [k, ...rest] = String(argv[++i]).split("=");
      opts.set[k] = rest.join("=");
    } else if (a.startsWith("--set=")) {
      const [k, ...rest] = a.slice("--set=".length).split("=");
      opts.set[k] = rest.join("=");
    } else if (!a.startsWith("-") && !opts.target) opts.target = a;
  }
  return opts;
}

// Coerce a --set string into the type the question expects.
function coerce(question, value) {
  if (question?.type === "confirm") return value === "true" || value === true;
  return value;
}

// ─── Non-interactive: defaults + --set overrides ────────────────────────────────
function resolveDefaults(set) {
  const answers = {};
  for (const q of questions) {
    if (q.when && !q.when(answers)) continue;
    if (Object.prototype.hasOwnProperty.call(set, q.name)) {
      answers[q.name] = coerce(q, set[q.name]);
    } else {
      answers[q.name] = typeof q.initial === "function" ? q.initial(answers) : q.initial;
    }
  }
  // Apply any --set keys that belong to gated questions skipped above (best effort).
  for (const [k, v] of Object.entries(set)) {
    if (!(k in answers)) {
      const q = questions.find((x) => x.name === k);
      answers[k] = q ? coerce(q, v) : v;
    }
  }
  return answers;
}

// ─── Interactive: clack TUI ─────────────────────────────────────────────────────
async function promptAll(initialTarget) {
  p.intro("forge — scaffold a tool-agnostic agent harness");

  let target = initialTarget;
  if (!target) {
    target = await p.text({
      message: "Target directory",
      placeholder: "./my-project",
      validate: (v) => (v && v.trim() ? undefined : "Required"),
    });
    if (p.isCancel(target)) bail();
  }

  const answers = {};
  let currentGroup = null;
  for (const q of questions) {
    if (q.when && !q.when(answers)) continue;

    // Print the group's objective the first time we enter it.
    if (q.group && q.group !== currentGroup) {
      currentGroup = q.group;
      const g = groups[q.group];
      if (g) p.note(g.objective, g.title);
    }

    const init = typeof q.initial === "function" ? q.initial(answers) : q.initial;
    let res;
    if (q.type === "select") {
      res = await p.select({ message: q.message, options: q.options, initialValue: init });
    } else if (q.type === "confirm") {
      res = await p.confirm({ message: q.message, initialValue: init });
    } else {
      // Show the example (hint) as the grey placeholder; apply the default on empty.
      res = await p.text({
        message: q.message,
        placeholder: q.hint || init || "",
        defaultValue: init || "",
      });
    }
    if (p.isCancel(res)) bail();
    answers[q.name] = res;
  }
  return { target, answers };
}

function bail() {
  p.cancel("Cancelled.");
  process.exit(1);
}

// ─── Output dir guard ───────────────────────────────────────────────────────────
function ensureEmptyDir(dir, force) {
  if (existsSync(dir) && readdirSync(dir).length > 0 && !force) {
    throw new Error(`Target "${dir}" exists and is not empty. Use --force to render anyway.`);
  }
  mkdirSync(dir, { recursive: true });
}

// ─── Post-gen: sync adapters in the rendered project ────────────────────────────
function runSync(outDir, silent) {
  const script = join(outDir, "tools", "sync-adapters.mjs");
  if (!existsSync(script)) return;
  const args = [script];
  if (silent) args.push("--silent");
  spawnSync(process.execPath, args, { cwd: outDir, stdio: silent ? "ignore" : "inherit" });
}

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const interactive = !opts.defaults && process.stdout.isTTY;

  let target = opts.target;
  let answers;

  if (interactive) {
    ({ target, answers } = await promptAll(target));
  } else {
    if (!target) {
      console.error("Error: target directory required (positional arg or --out) in non-interactive mode.");
      process.exit(1);
    }
    answers = resolveDefaults(opts.set);
  }

  const outDir = isAbsolute(target) ? target : resolve(process.cwd(), target);
  const ctx = computeContext(answers);

  const spin = interactive ? p.spinner() : null;
  spin?.start("Rendering");
  try {
    ensureEmptyDir(outDir, opts.force);
    const { written } = renderTree(TEMPLATE_DIR, outDir, ctx);
    runSync(outDir, interactive);
    spin?.stop(`Rendered ${written.length} files`);
  } catch (err) {
    spin?.stop("Failed");
    if (interactive) p.cancel(err.message);
    else console.error("Error:", err.message);
    process.exit(1);
  }

  const next = [
    `cd ${target}`,
    ctx.task_runner === "just"
      ? "edit the justfile, then: just sync-adapters"
      : "wire the task commands, then: node tools/sync-adapters.mjs",
    'git init && git add -A && git commit -m "chore: scaffold from forge"',
  ];

  if (interactive) {
    p.note(next.join("\n"), "Next steps");
    p.outro(`Scaffolded "${ctx.project_name}" → ${target}`);
  } else {
    console.log(`Scaffolded "${ctx.project_name}" → ${outDir}`);
    console.log("Next:\n  " + next.join("\n  "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
