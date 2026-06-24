// config.mjs — single source of truth for the scaffolder: questions, derived
// variables, and file-exclusion rules.

/** kebab-case slug from a free-text name. */
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Default issue prefix: first 4 alphanumerics of the slug, upper-cased. */
function defaultPrefix(slug) {
  return (slug || "proj").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "PROJ";
}

// Group headers shown in the TUI before their questions — each states the OBJECTIVE
// of that step so the user knows why it's being asked.
export const groups = {
  identity: { title: "Identity", objective: "Names used in README, LICENSE, CODEOWNERS, and branch/PR prefixes." },
  agent: { title: "Agent surface", objective: "Which agent leads (decides which adapter ships) and the human language it speaks." },
  integrations: { title: "Integrations", objective: "Issue tracker + git host. They light up status sync; pick 'none' to stay local-only." },
  tasks: { title: "Task runner (the stack-agnostic seam)", objective: "How skills and CI run commands. You can leave the commands blank and fill the runner file later." },
  features: { title: "Optional features", objective: "Toggle parts of the harness on or off." },
  meta: { title: "License", objective: "Legal terms for the generated project." },
};

// Question schema. `when` gates visibility; `initial` may be a function of prior answers.
// `hint` is an example shown as a placeholder in the TUI. Types: text | select | confirm.
export const questions = [
  // ── Identity ──
  { group: "identity", name: "project_name", type: "text", message: "Project name", hint: "e.g. Acme API", initial: () => "My Project" },
  { group: "identity", name: "project_slug", type: "text", message: "Slug — used in dirs, branches, package names", hint: "e.g. acme-api", initial: (a) => slugify(a.project_name) },
  { group: "identity", name: "project_description", type: "text", message: "One-line description", hint: "e.g. Internal billing service", initial: () => "" },
  { group: "identity", name: "author_name", type: "text", message: "Author or org — for LICENSE and CODEOWNERS", hint: "e.g. Acme Inc / Jane Doe", initial: () => "" },

  // ── Agent surface ──
  {
    group: "agent", name: "primary_agent", type: "select",
    message: "Primary coding agent — ships its adapter; others read AGENTS.md natively",
    initial: () => "claude",
    options: [
      { value: "claude", label: "Claude Code — generates .claude/ (CLAUDE.md, skills, hooks)" },
      { value: "codex", label: "OpenAI Codex — reads AGENTS.md, no extra adapter" },
      { value: "cursor", label: "Cursor — reads AGENTS.md, no extra adapter" },
      { value: "copilot", label: "GitHub Copilot — generates .github/ instructions" },
      { value: "multi", label: "Multiple / agnostic — ship every adapter" },
    ],
  },
  {
    group: "agent", name: "artifact_language", type: "select",
    message: "Language the agent talks to humans in (skill bodies stay English)",
    initial: () => "en",
    options: [
      { value: "en", label: "English" },
      { value: "pt-BR", label: "Português (BR)" },
      { value: "es", label: "Español" },
    ],
  },

  // ── Integrations ──
  {
    group: "integrations", name: "issue_tracker", type: "select",
    message: "Issue tracker for plan/SDD status sync",
    initial: () => "github",
    options: [
      { value: "github", label: "GitHub Issues" },
      { value: "linear", label: "Linear" },
      { value: "none", label: "None — local-only (branch → commit → PR)" },
    ],
  },
  {
    group: "integrations", name: "issue_prefix", type: "text",
    message: "Issue key prefix used in branches/PRs",
    hint: "e.g. ACME → ACME-42",
    when: (a) => a.issue_tracker !== "none",
    initial: (a) => defaultPrefix(a.project_slug || slugify(a.project_name)),
  },
  {
    group: "integrations", name: "git_host", type: "select",
    message: "Git host — where PRs/CI live",
    initial: () => "github",
    options: [
      { value: "github", label: "GitHub" },
      { value: "gitlab", label: "GitLab" },
      { value: "none", label: "None" },
    ],
  },

  // ── Task runner ──
  {
    group: "tasks", name: "task_runner", type: "select",
    message: "Task runner — the one file that names your real stack commands",
    initial: () => "just",
    options: [
      { value: "just", label: "just (recommended) — renders a justfile" },
      { value: "make", label: "make — renders a Makefile" },
      { value: "npm", label: "npm scripts — documents the contract in TASKS.md" },
      { value: "none", label: "none — documented shell commands" },
    ],
  },
  { group: "tasks", name: "lint_cmd", type: "text", message: "Lint command (blank = skipped)", hint: "e.g. eslint . / ruff check .", initial: () => "" },
  { group: "tasks", name: "typecheck_cmd", type: "text", message: "Typecheck command (blank = skipped)", hint: "e.g. tsc --noEmit / mypy .", initial: () => "" },
  { group: "tasks", name: "test_cmd", type: "text", message: "Test command (blank = skipped)", hint: "e.g. vitest run / pytest / go test ./...", initial: () => "" },
  { group: "tasks", name: "build_cmd", type: "text", message: "Build command (blank = skipped)", hint: "e.g. next build / go build ./...", initial: () => "" },
  { group: "tasks", name: "e2e_cmd", type: "text", message: "E2E command (blank = skipped)", hint: "e.g. playwright test", initial: () => "" },
  { group: "tasks", name: "runtime_paths", type: "text", message: "Globs that gate E2E/runtime checks in CI (comma-separated)", hint: "e.g. src/**,app/**", initial: () => "src/**" },

  // ── Optional features ──
  { group: "features", name: "include_sdd", type: "confirm", message: "Include the SDD pipeline (spec → plan → tasks → implement → review → verify)?", initial: () => true },
  { group: "features", name: "include_pr_review_ai", type: "confirm", message: "Include the multi-agent AI PR-review skill + workflow?", initial: () => true },
  { group: "features", name: "include_hooks", type: "confirm", message: "Include the controller-write guard hook (Claude Code only)?", initial: () => true },

  // ── License ──
  {
    group: "meta", name: "license", type: "select", message: "License",
    initial: () => "MIT",
    options: [
      { value: "MIT", label: "MIT" },
      { value: "Apache-2.0", label: "Apache-2.0" },
      { value: "proprietary", label: "proprietary" },
    ],
  },
];

/** Fill in derived variables. Mutates a copy and returns the full render context. */
export function computeContext(answers) {
  const ctx = { ...answers };
  ctx.project_slug = ctx.project_slug?.trim() || slugify(ctx.project_name);
  if (ctx.issue_tracker !== "none") {
    ctx.issue_prefix = ctx.issue_prefix?.trim() || defaultPrefix(ctx.project_slug);
  } else {
    ctx.issue_prefix = ctx.issue_prefix || "";
  }
  ctx.task_file =
    ctx.task_runner === "just" ? "justfile" : ctx.task_runner === "make" ? "Makefile" : "TASKS.md";
  ctx.include_claude = ["claude", "multi"].includes(ctx.primary_agent);
  ctx.include_copilot = ["copilot", "multi"].includes(ctx.primary_agent);
  ctx.year = String(new Date().getFullYear());
  return ctx;
}

/**
 * Whether a rendered relative path (POSIX, .jinja already stripped) should be skipped.
 * The exclusion rules that prune optional files from the render.
 */
export function isExcluded(relPath, ctx) {
  const p = relPath.replace(/\\/g, "/");
  const base = p.split("/").pop();
  const underAny = (...prefixes) => prefixes.some((x) => p === x || p.startsWith(x + "/"));

  if (base.startsWith("~") || base.endsWith(".bak")) return true;
  if (p.split("/").includes("__pycache__")) return true;
  if (underAny(".git")) return true;

  if (!ctx.include_sdd && (underAny(".agents/skills/sdd") || p === "docs/sdd-workflow.md")) return true;
  if (!ctx.include_pr_review_ai && (underAny(".agents/skills/pr-review") || p === ".github/workflows/pr-review.yml")) return true;
  if (!ctx.include_hooks && underAny(".claude/hooks")) return true;
  if (!ctx.include_claude && underAny(".claude")) return true;
  if (!ctx.include_copilot && (p === ".github/copilot-instructions.md" || underAny(".github/instructions"))) return true;

  return false;
}
