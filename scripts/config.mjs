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

// Question schema. `when` gates visibility; `initial` may be a function of prior answers.
// Types: text | select | confirm. Selects list {value, label}.
export const questions = [
  { name: "project_name", type: "text", message: "Project name", initial: () => "My Project" },
  { name: "project_slug", type: "text", message: "Slug (kebab-case)", initial: (a) => slugify(a.project_name) },
  { name: "project_description", type: "text", message: "One-line description", initial: () => "" },
  { name: "author_name", type: "text", message: "Author or org (LICENSE, CODEOWNERS)", initial: () => "" },
  {
    name: "primary_agent", type: "select", message: "Primary coding agent",
    initial: () => "claude",
    options: [
      { value: "claude", label: "Claude Code" },
      { value: "codex", label: "OpenAI Codex" },
      { value: "cursor", label: "Cursor" },
      { value: "copilot", label: "GitHub Copilot" },
      { value: "multi", label: "Multiple / agnostic (ship every adapter)" },
    ],
  },
  {
    name: "artifact_language", type: "select", message: "Language the agent talks to humans in (skills stay English)",
    initial: () => "en",
    options: [
      { value: "en", label: "English" },
      { value: "pt-BR", label: "Português (BR)" },
      { value: "es", label: "Español" },
    ],
  },
  {
    name: "issue_tracker", type: "select", message: "Issue tracker (none = local-only)",
    initial: () => "github",
    options: [
      { value: "github", label: "GitHub Issues" },
      { value: "linear", label: "Linear" },
      { value: "none", label: "None" },
    ],
  },
  {
    name: "issue_prefix", type: "text", message: "Issue key prefix (e.g. ACME for ACME-42)",
    when: (a) => a.issue_tracker !== "none",
    initial: (a) => defaultPrefix(a.project_slug || slugify(a.project_name)),
  },
  {
    name: "git_host", type: "select", message: "Git host",
    initial: () => "github",
    options: [
      { value: "github", label: "GitHub" },
      { value: "gitlab", label: "GitLab" },
      { value: "none", label: "None" },
    ],
  },
  {
    name: "task_runner", type: "select", message: "Task runner (the stack-agnostic seam)",
    initial: () => "just",
    options: [
      { value: "just", label: "just (recommended)" },
      { value: "make", label: "make" },
      { value: "npm", label: "npm scripts" },
      { value: "none", label: "none / documented shell" },
    ],
  },
  { name: "lint_cmd", type: "text", message: "Lint command (blank = skipped)", initial: () => "" },
  { name: "typecheck_cmd", type: "text", message: "Typecheck command (blank = skipped)", initial: () => "" },
  { name: "test_cmd", type: "text", message: "Test command (blank = skipped)", initial: () => "" },
  { name: "build_cmd", type: "text", message: "Build command (blank = skipped)", initial: () => "" },
  { name: "e2e_cmd", type: "text", message: "E2E command (blank = skipped)", initial: () => "" },
  { name: "runtime_paths", type: "text", message: "Globs that gate E2E/runtime checks in CI (comma-separated)", initial: () => "src/**" },
  { name: "include_sdd", type: "confirm", message: "Include the SDD pipeline (spec → plan → tasks → implement)?", initial: () => true },
  { name: "include_pr_review_ai", type: "confirm", message: "Include the multi-agent AI PR-review skill + workflow?", initial: () => true },
  { name: "include_hooks", type: "confirm", message: "Include the controller-write guard hook (Claude Code)?", initial: () => true },
  {
    name: "license", type: "select", message: "License",
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
