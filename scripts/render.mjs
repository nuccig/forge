// render.mjs — render the template/ tree into a target directory with Nunjucks
// (Jinja-compatible), honoring the .jinja suffix and the exclusion rules.

import { readdirSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import nunjucks from "nunjucks";
import { isExcluded } from "./config.mjs";

const SUFFIX = ".jinja";

function makeEnv() {
  // Match Jinja/Copier defaults: no autoescape, no block trimming, tolerant of undefined.
  const env = new nunjucks.Environment(null, {
    autoescape: false,
    trimBlocks: false,
    lstripBlocks: false,
    throwOnUndefined: false,
  });
  env.addFilter("trim", (s) => String(s ?? "").trim());
  return env;
}

/** Recursively collect every file under dir as absolute paths. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

/**
 * Render templateDir → outDir using ctx.
 * @returns {{ written: string[], skipped: string[] }}
 */
export function renderTree(templateDir, outDir, ctx) {
  const env = makeEnv();
  const written = [];
  const skipped = [];

  for (const srcAbs of walk(templateDir)) {
    const relRaw = relative(templateDir, srcAbs); // e.g. ".claude/CLAUDE.md.jinja"
    const isTemplate = relRaw.endsWith(SUFFIX);

    // Render any {{ }} in path segments, then drop the .jinja suffix.
    const renderedRel = relRaw
      .split(sep)
      .map((seg) => env.renderString(seg, ctx))
      .join("/");
    const finalRel = isTemplate ? renderedRel.slice(0, -SUFFIX.length) : renderedRel;

    if (isExcluded(finalRel, ctx)) {
      skipped.push(finalRel);
      continue;
    }

    const destAbs = join(outDir, finalRel.split("/").join(sep));
    mkdirSync(join(destAbs, ".."), { recursive: true });

    if (isTemplate) {
      const rendered = env.renderString(readFileSync(srcAbs, "utf8"), ctx);
      writeFileSync(destAbs, rendered, "utf8");
    } else {
      copyFileSync(srcAbs, destAbs);
    }
    written.push(finalRel);
  }

  return { written, skipped };
}
