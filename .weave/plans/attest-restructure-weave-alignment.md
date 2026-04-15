# Attest Restructure — Weave Convention Alignment

## TL;DR
> **Summary**: Restructure the Attest codebase from its current `.opencode/plugins/attest/` layout to a Weave-aligned `src/` structure with co-located unit tests, a Bun build step, CI/CD workflows, versioning, and proper npm package configuration.
> **Estimated Effort**: Large

## Context
### Original Request
Restructure the Attest codebase (intent-gate repo) to match the conventions established by Weave (opencode-weave repo). This covers source layout, test organization, build pipeline, CI/CD, versioning, documentation, and package configuration.

### Key Findings

**Current Attest layout:**
- Source: `.opencode/plugins/attest/` (37 source files across 10 modules)
- Entry: `.opencode/plugins/attest.ts` → re-exports `./attest/entry`
- Tests: `tests/unit/` (24 test files), `tests/integration/` (7 tests + fixtures), `tests/e2e/` (8 tests), `tests/smoke/` (2 tests), `tests/evals/` (eval runner + 2 cases)
- Workspace: Bun workspace with `.opencode` as member; `.opencode/package.json` declares `@weave/attest-opencode-plugin`
- No build step, no `dist/`, no CI, no versioning, no CHANGELOG

**Weave conventions (target):**
- Source in `src/` with co-located `*.test.ts` unit tests
- Integration/e2e tests in `test/integration/` and `test/e2e/` with `test/testkit/` for shared fixtures
- Build: `script/build.ts` using `Bun.build()` → `dist/index.js`, then `tsc --emitDeclarationOnly` → `dist/index.d.ts`
- `tsconfig.json`: `rootDir: "src"`, `outDir: "dist"`, `declarationDir: "dist"`, excludes `*.test.ts` and `script`
- `bunfig.toml`: `[test] preload = ["./test-setup.ts"], root = "./src"`
- `test/tsconfig.json`: extends root, sets `rootDir: ".."`, includes `["./**/*", "../src/**/*"]`
- `package.json`: scoped name, `version`, `main: "dist/index.js"`, `types: "dist/index.d.ts"`, `exports` map, `files: ["dist/"]`, `publishConfig` with registry + access
- CI: `ci.yml` (test + typecheck + smoke evals + audit), `publish.yml` (build + verify + npm publish with prerelease support), `codeql.yml` (security scanning), `evals.yml` (behavioral eval matrix)
- CHANGELOG.md in Keep a Changelog format with version links
- `evals/` at root with `baselines/`, `cases/`, `results/`, `rubrics/`, `scenarios/`, `suites/`
- `docs/` with architecture, testing-strategy, releasing, configuration docs

**Import pattern impact:**
- All 24 unit tests import from `../../../.opencode/plugins/attest/...` — these become co-located `./foo.test.ts` next to `./foo.ts`
- All 7 integration tests import from `../../.opencode/plugins/attest/...` — these become `../../src/...`
- All 8 e2e tests import from `../../.opencode/plugins/attest/...` — these become `../../src/...`
- Smoke tests reference `.opencode/package.json` and `tui.json` — need rethinking since the plugin entry point changes

**Plugin entry point consideration:**
- Attest is a TUI plugin (`@opencode-ai/plugin/tui`), not a standard plugin like Weave (`@opencode-ai/plugin`)
- `.opencode/plugins/attest.ts` must remain as the OpenCode plugin entry point (OpenCode discovers plugins from `.opencode/tui.json`)
- After restructure, this file should import from the built `dist/` or from `src/` during development
- `.opencode/tui.json` continues to reference `./plugins/attest.ts`

## Objectives
### Core Objective
Align Attest's project structure, build pipeline, test organization, and CI/CD with Weave's established conventions so both projects share the same development workflow patterns.

### Deliverables
- [x] Source code relocated to `src/` with existing module structure preserved
- [x] Unit tests co-located alongside source files in `src/`
- [x] Integration and e2e tests in `test/integration/` and `test/e2e/`
- [x] Evals promoted to root `evals/` directory
- [x] Build step producing `dist/index.js` and `dist/index.d.ts`
- [x] CI/CD workflows (ci.yml, publish.yml, codeql.yml)
- [x] Versioned package with CHANGELOG.md
- [x] Updated package.json, tsconfig.json, bunfig.toml
- [x] Documentation in `docs/`

### Definition of Done
- [x] `bun run build` produces `dist/index.js` and `dist/index.d.ts`
- [x] `bun run typecheck` passes with zero errors
- [x] `bun test` discovers and passes all unit, integration, and e2e tests
- [x] `.opencode/plugins/attest.ts` successfully imports from the built or source package
- [x] `bun run evals` runs the eval suite from the new location
- [x] No source files remain in `.opencode/plugins/attest/`

### Guardrails (Must NOT)
- Must NOT break the `.opencode/tui.json` → `./plugins/attest.ts` plugin discovery path
- Must NOT change the public API surface of the plugin (command names, IDs, slash commands)
- Must NOT remove the `.opencode/` directory entirely — it still hosts `tui.json`, `commands/`, and the plugin entry shim
- Must NOT introduce runtime dependencies not already in use
- Must NOT delete `.weave/plans/` documentation — move relevant content to `docs/`

## TODOs

- [x] 1. Create `src/` directory structure
  **What**: Create the `src/` directory mirroring the existing module layout from `.opencode/plugins/attest/`. The module structure is already clean and doesn't need re-layering — Attest's modules (config, domain, evidence, flow, git, llm, path, policy, session, ui) map naturally. Create `src/index.ts` as the package entry point that re-exports the plugin default export and key types.
  **Files**:
    - `src/index.ts` (new — package entry point, mirrors Weave's `src/index.ts` pattern)
    - `src/entry.ts` (moved from `.opencode/plugins/attest/entry.ts`)
    - `src/types.ts` (moved from `.opencode/plugins/attest/types.ts`)
    - `src/config/load-config.ts`
    - `src/domain/diff-context.ts`
    - `src/domain/evidence.ts`
    - `src/domain/risk.ts`
    - `src/domain/session.ts`
    - `src/domain/verdict.ts`
    - `src/evidence/pathing.ts`
    - `src/evidence/write-json.ts`
    - `src/evidence/write-markdown.ts`
    - `src/flow/build-interview-plan.ts`
    - `src/flow/collect-intent.ts`
    - `src/flow/run-attest.ts`
    - `src/flow/run-resume.ts`
    - `src/git/collect-diff-context.ts`
    - `src/git/resolve-diff-target.ts`
    - `src/git/shared.ts`
    - `src/git/truncate-diff.ts`
    - `src/llm/client.ts`
    - `src/llm/evaluate-answers.ts`
    - `src/llm/fallbacks.ts`
    - `src/llm/generate-questions.ts`
    - `src/llm/opencode-session-client.ts`
    - `src/llm/schema.ts`
    - `src/llm/prompts/evaluate-interview.md`
    - `src/llm/prompts/generate-interview.md`
    - `src/path/safe-paths.ts`
    - `src/policy/apply-escalation-rules.ts`
    - `src/policy/classify-risk.ts`
    - `src/policy/compute-verdict.ts`
    - `src/policy/select-interview-depth.ts`
    - `src/session/load-latest.ts`
    - `src/session/resume-run.ts`
    - `src/session/session-paths.ts`
    - `src/session/store.ts`
    - `src/ui/collect-interactive.ts`
    - `src/ui/render-summary.ts`
    - `src/ui/render-verdict.ts`
  **Acceptance**: All 37 source files + 2 prompt files exist under `src/`. `src/index.ts` exports the plugin default and key types. No source files remain in `.opencode/plugins/attest/` (only the entry shim remains at `.opencode/plugins/attest.ts`).

- [x] 2. Update all internal imports within `src/`
  **What**: After moving files, all relative imports within `src/` must be updated. Currently imports use paths like `./flow/run-attest`, `./llm/client`, `./types` etc. relative to the `.opencode/plugins/attest/` root. Since the module structure is preserved 1:1, most internal imports should remain identical. Verify every file compiles. The `src/index.ts` entry point should:
    - Import and re-export the default plugin from `./entry`
    - Export key types: `AttestPluginId`, `DeclaredIntent`, `InterviewQuestion`, etc.
  **Files**:
    - `src/index.ts`
    - `src/entry.ts` (verify imports resolve correctly)
    - Any file whose relative import depth changed
  **Acceptance**: `bunx tsc --noEmit -p tsconfig.json` passes with zero errors on the `src/` tree.

- [x] 3. Co-locate unit tests alongside source in `src/`
  **What**: Move each unit test from `tests/unit/` to sit next to its source file in `src/`, following Weave's `*.test.ts` co-location pattern. Update all imports from the deep `../../../.opencode/plugins/attest/...` paths to simple relative imports (e.g., `./classify-risk`). The mapping is:

  | From | To |
  |------|-----|
  | `tests/unit/config/load-config.test.ts` | `src/config/load-config.test.ts` |
  | `tests/unit/domain/diff-context.test.ts` | `src/domain/diff-context.test.ts` |
  | `tests/unit/domain/evidence.test.ts` | `src/domain/evidence.test.ts` |
  | `tests/unit/domain/risk.test.ts` | `src/domain/risk.test.ts` |
  | `tests/unit/domain/session.test.ts` | `src/domain/session.test.ts` |
  | `tests/unit/domain/verdict.test.ts` | `src/domain/verdict.test.ts` |
  | `tests/unit/evidence/pathing.test.ts` | `src/evidence/pathing.test.ts` |
  | `tests/unit/evidence/write-json.test.ts` | `src/evidence/write-json.test.ts` |
  | `tests/unit/evidence/write-markdown.test.ts` | `src/evidence/write-markdown.test.ts` |
  | `tests/unit/flow/collect-intent.test.ts` | `src/flow/collect-intent.test.ts` |
  | `tests/unit/git/resolve-diff-target.test.ts` | `src/git/resolve-diff-target.test.ts` |
  | `tests/unit/git/truncate-diff.test.ts` | `src/git/truncate-diff.test.ts` |
  | `tests/unit/llm/client.test.ts` | `src/llm/client.test.ts` |
  | `tests/unit/llm/evaluate-answers.test.ts` | `src/llm/evaluate-answers.test.ts` |
  | `tests/unit/llm/generate-questions.test.ts` | `src/llm/generate-questions.test.ts` |
  | `tests/unit/llm/schema.test.ts` | `src/llm/schema.test.ts` |
  | `tests/unit/policy/apply-escalation-rules.test.ts` | `src/policy/apply-escalation-rules.test.ts` |
  | `tests/unit/policy/classify-risk.test.ts` | `src/policy/classify-risk.test.ts` |
  | `tests/unit/policy/compute-verdict.test.ts` | `src/policy/compute-verdict.test.ts` |
  | `tests/unit/policy/select-interview-depth.test.ts` | `src/policy/select-interview-depth.test.ts` |
  | `tests/unit/session/load-latest.test.ts` | `src/session/load-latest.test.ts` |
  | `tests/unit/session/session-paths.test.ts` | `src/session/session-paths.test.ts` |
  | `tests/unit/session/store.test.ts` | `src/session/store.test.ts` |
  | `tests/unit/plugin-module.test.ts` | `src/index.test.ts` (tests the plugin module export) |

  Each test file's imports change from `../../../.opencode/plugins/attest/domain/risk` to `./risk` (or similar short relative path).
  **Files**: All 24 test files listed above (moved + imports updated)
  **Acceptance**: `bun test src/` discovers and passes all 24 co-located unit tests. No test files remain in `tests/unit/`.

- [x] 4. Restructure integration and e2e tests into `test/`
  **What**: Create `test/integration/` and `test/e2e/` directories following Weave's convention. Move integration tests, e2e tests, and shared fixtures. Create `test/testkit/` for shared test utilities (like `project-fixture.ts`). Create `test/tsconfig.json` extending the root tsconfig (matching Weave's pattern). Update all imports from `../../.opencode/plugins/attest/...` to `../../src/...`.

  Integration tests to move:
  - `tests/integration/*.test.ts` → `test/integration/*.test.ts` (7 test files)
  - `tests/integration/fixtures/` → `test/testkit/fixtures/` (shared fixture utilities)

  E2e tests to move:
  - `tests/e2e/*.test.ts` → `test/e2e/*.test.ts` (8 test files)

  Smoke tests disposition:
  - `tests/smoke/plugin-files.smoke.test.ts` → `test/e2e/plugin-files.smoke.test.ts` (structural verification fits e2e)
  - `tests/smoke/opencode-plugin-load.test.ts` → `test/e2e/opencode-plugin-load.e2e.test.ts` (plugin loading is e2e)
  - `tests/smoke/fixtures/` → `test/testkit/fixtures/` (merge with integration fixtures)

  Create `test/tsconfig.json`:
  ```json
  {
    "extends": "../tsconfig.json",
    "compilerOptions": {
      "rootDir": ".."
    },
    "include": ["./**/*", "../src/**/*"]
  }
  ```
  **Files**:
    - `test/tsconfig.json` (new)
    - `test/integration/*.test.ts` (7 files moved + imports updated)
    - `test/e2e/*.test.ts` (10 files: 8 from e2e + 2 from smoke, imports updated)
    - `test/testkit/fixtures/project-fixture.ts` (moved from `tests/integration/fixtures/`)
    - `test/testkit/fixtures/repos/` (moved from `tests/integration/fixtures/repos/`)
    - `test/testkit/fixtures/plugin-load/` (moved from `tests/smoke/fixtures/plugin-load/`)
  **Acceptance**: `bun test test/` discovers and passes all integration, e2e, and former smoke tests. No files remain in `tests/integration/`, `tests/e2e/`, or `tests/smoke/`.

- [x] 5. Promote evals to root `evals/` directory
  **What**: Move `tests/evals/` to root `evals/` following Weave's convention. Update the eval runner's import paths from `../../.opencode/plugins/attest/...` to `../src/...`. Structure:
  ```
  evals/
    cases/
      question-relevance.json
      verdict-consistency.json
    run-evals.ts
    reporting.ts
    README.md
  ```
  **Files**:
    - `evals/run-evals.ts` (moved + imports updated)
    - `evals/reporting.ts` (moved)
    - `evals/cases/question-relevance.json` (moved)
    - `evals/cases/verdict-consistency.json` (moved)
    - `evals/README.md` (moved)
  **Acceptance**: `bun run evals/run-evals.ts` executes successfully. The `tests/` directory is now empty and can be deleted.

- [x] 6. Delete the old `tests/` directory and `.opencode/plugins/attest/` source
  **What**: After all tests and source have been moved and verified, remove the now-empty directories:
  - Delete `tests/` entirely (all contents moved to `src/`, `test/`, and `evals/`)
  - Delete `.opencode/plugins/attest/` entirely (all source moved to `src/`)
  - Keep `.opencode/plugins/attest.ts` (the entry shim — updated in step 7)
  - Keep `.opencode/commands/attest.md` (slash command spike)
  - Keep `.opencode/tui.json` (plugin discovery config)
  **Files**:
    - `tests/` (delete entire directory)
    - `.opencode/plugins/attest/` (delete entire directory)
  **Acceptance**: `git status` shows the old directories removed. No broken imports anywhere.

- [x] 7. Update plugin entry point shim
  **What**: Update `.opencode/plugins/attest.ts` to import from the new location. During development it should import from `src/`; for published use it would import from `dist/`. Since Attest is loaded locally by OpenCode (not from npm), the shim should import from source:
  ```ts
  import plugin from "../../src/entry"
  export default plugin
  ```
  Also update `.opencode/package.json` to remove the `@opencode-ai/plugin` dependency (it moves to the root `package.json`). The `.opencode/package.json` becomes minimal — just enough for OpenCode workspace discovery. Consider whether the `.opencode` workspace member is still needed; if the root `package.json` has the plugin dependency, the workspace may be unnecessary.
  **Files**:
    - `.opencode/plugins/attest.ts` (update import path)
    - `.opencode/package.json` (simplify — remove dependencies that move to root)
  **Acceptance**: OpenCode can still discover and load the plugin via `.opencode/tui.json` → `./plugins/attest.ts` → `../../src/entry`.

- [x] 8. Create build step (`script/build.ts`)
  **What**: Create `script/build.ts` following Weave's exact pattern. Attest's build is simpler than Weave's (no `jsonc-parser` ESM workaround needed). The build should:
  - Use `Bun.build()` with entry point `./src/index.ts`
  - Output to `./dist/` as ESM targeting Node
  - Externalize `@opencode-ai/plugin` (and `@opentui/core`, `@opentui/solid` if used at runtime)
  - No minification (matches Weave)
  - Exit with error code on failure
  - Log success with output paths

  ```ts
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    target: "node",
    format: "esm",
    external: ["@opencode-ai/plugin", "@opentui/core", "@opentui/solid"],
    minify: false,
  })

  if (!result.success) {
    for (const log of result.logs) console.error(log)
    process.exit(1)
  }

  console.log("Build succeeded:", result.outputs.map(o => o.path))
  ```
  **Files**:
    - `script/build.ts` (new)
  **Acceptance**: `bun run script/build.ts` produces `dist/index.js`. `bun run build` (via package.json script) produces both `dist/index.js` and `dist/index.d.ts`.

- [x] 9. Update root `package.json`
  **What**: Transform the root `package.json` from a private workspace root into a proper publishable package following Weave's conventions. Key changes:
  - Change `name` to `@weave/attest-opencode-plugin` (keep existing scoped name from `.opencode/package.json`)
  - Remove `private: true`
  - Add `version: "0.1.0"`
  - Add `description`, `author`, `license`, `homepage`, `repository`
  - Add `main: "dist/index.js"`, `types: "dist/index.d.ts"`
  - Add `exports` map (matching Weave's pattern)
  - Add `files: ["dist/"]`
  - Add `publishConfig` with registry and access
  - Move `@opencode-ai/plugin` from `.opencode/package.json` to root `dependencies`
  - Keep `@opentui/core` and `@opentui/solid` if they are runtime deps
  - Update scripts:
    - `build`: `bun run script/build.ts && tsc --emitDeclarationOnly`
    - `clean`: `rm -rf dist`
    - `typecheck`: `tsc --noEmit`
    - `test`: `bun test`
    - `test:unit`: `bun test src/`
    - `test:integration`: `bun test test/integration/`
    - `test:e2e`: `bun test test/e2e/`
    - `evals`: `bun run evals/run-evals.ts`
  - Remove `workspaces` field (evaluate if `.opencode` workspace is still needed — likely yes for OpenCode plugin loading, but deps move to root)
  - Add `keywords`: `["opencode", "plugin", "attest", "comprehension-gate", "weave"]`
  **Files**:
    - `package.json` (rewrite)
  **Acceptance**: `bun install` succeeds. `bun run build` succeeds. Package metadata is correct.

- [x] 10. Update root `tsconfig.json`
  **What**: Align with Weave's tsconfig pattern. Key changes:
  - Set `target: "ESNext"` (from `ES2022`)
  - Add `declaration: true`, `declarationDir: "dist"`, `outDir: "dist"`
  - Set `rootDir: "src"`
  - Remove `noEmit: true` (build now emits declarations)
  - Set `include: ["src/**/*"]`
  - Set `exclude: ["node_modules", "dist", "**/*.test.ts", "script"]`
  - Set `types: ["bun-types"]` (Weave uses `bun-types`, Attest currently uses `["bun", "node"]`)
  - Add `lib: ["ESNext"]`
  - Add `resolveJsonModule: true`

  Final tsconfig:
  ```json
  {
    "compilerOptions": {
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "declaration": true,
      "declarationDir": "dist",
      "outDir": "dist",
      "rootDir": "src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "lib": ["ESNext"],
      "types": ["bun-types"]
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "script"]
  }
  ```
  **Files**:
    - `tsconfig.json` (rewrite)
  **Acceptance**: `bun run typecheck` passes. `tsc --emitDeclarationOnly` produces `dist/index.d.ts`.

- [x] 11. Add `bunfig.toml` and `test-setup.ts`
  **What**: Create `bunfig.toml` matching Weave's pattern:
  ```toml
  [test]
  preload = ["./test-setup.ts"]
  root = "./src"
  ```
  Create `test-setup.ts` as a placeholder:
  ```ts
  // Attest test setup — placeholder for future global test configuration
  ```
  Note: Weave's `bunfig.toml` sets `root = "./src"` which means `bun test` discovers tests from `src/` by default. For Attest, we also need integration/e2e tests in `test/` to be discoverable. Bun's test runner discovers tests from the root by default when no root is specified, but with `root = "./src"` only `src/` tests run with bare `bun test`. The `bun test` script should explicitly include both: `bun test src/ test/`. Update the `test` script in `package.json` accordingly, or omit the `root` directive to let Bun discover all `*.test.ts` files.

  **Decision**: Set `root = "."` (or omit it) so `bun test` discovers tests in both `src/` and `test/`. Keep separate scripts for `test:unit` (`bun test src/`) and `test:integration`/`test:e2e` for targeted runs.
  **Files**:
    - `bunfig.toml` (new)
    - `test-setup.ts` (new)
  **Acceptance**: `bun test` discovers tests in both `src/` and `test/` directories.

- [x] 12. Add CI/CD workflows
  **What**: Create GitHub Actions workflows following Weave's patterns, adapted for Attest.

  **`.github/workflows/ci.yml`** — mirrors Weave's ci.yml:
  - Trigger: push to main, PRs to main
  - Job 1 "Test & Typecheck": checkout → setup-bun → install (frozen-lockfile) → typecheck → run tests → audit deps
  - Job 2 "E2E — Plugin Loading" (optional, if Attest needs CLI e2e): checkout → setup-bun → install → build → install opencode CLI → configure plugin → verify loading → run e2e tests

  **`.github/workflows/publish.yml`** — mirrors Weave's publish.yml:
  - Trigger: release published, workflow_dispatch with version input
  - Steps: checkout → setup-bun → setup-node → install → typecheck → test → build → verify dist output → set version + dist-tag → npm publish
  - Support prerelease versions (publish to `next` dist-tag)
  - No website dispatch step (Attest doesn't have a website)

  **`.github/workflows/codeql.yml`** — mirrors Weave's codeql.yml exactly:
  - Trigger: push/PR to main + weekly schedule
  - Steps: checkout → init CodeQL (javascript-typescript, security-and-quality) → analyze

  Skip `evals.yml` and `speckit-upstream-check.yml` for now — Attest's eval suite is too simple to warrant a matrix workflow, and there's no upstream to track.
  **Files**:
    - `.github/workflows/ci.yml` (new)
    - `.github/workflows/publish.yml` (new)
    - `.github/workflows/codeql.yml` (new)
  **Acceptance**: Workflows are valid YAML. CI workflow would pass if pushed (typecheck + tests pass locally).

- [x] 13. Add versioning and CHANGELOG.md
  **What**: Create `CHANGELOG.md` in Keep a Changelog format. Set initial version to 0.1.0 documenting the current state of the plugin. Follow Weave's exact format:

  ```markdown
  # Changelog

  All notable changes to this project will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
  and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

  ## [0.1.0] - YYYY-MM-DD

  ### Added

  - OpenCode TUI plugin with `/attest` slash command, branch diff mode, and session resume
  - Deterministic risk classification, escalation rules, verdict policy, and interview depth selection
  - LLM contract layer with stub client, question generation, and answer evaluation
  - Evidence artifact writing (JSON + Markdown) with safe path handling
  - Session persistence with resume support
  - Interactive UI for intent collection and answer gathering
  - Git diff inspection with truncation for large diffs
  - Configuration loading from `.attest/config.json`
  - Behavioral eval harness with question-relevance and verdict-consistency cases
  - Full test suite: 24 unit tests, 7 integration tests, 8 e2e tests

  [0.1.0]: https://github.com/pgermishuys/intent-gate/releases/tag/v0.1.0
  ```

  Also create `.npmrc` (empty, matching Weave — placeholder for auth config):
  ```
  ```
  **Files**:
    - `CHANGELOG.md` (new)
    - `.npmrc` (new, empty)
  **Acceptance**: CHANGELOG.md exists with valid Keep a Changelog format. Version in `package.json` matches `0.1.0`.

- [x] 14. Create `docs/` directory
  **What**: Create documentation following Weave's `docs/` convention. Move relevant content from `.weave/plans/` and README.md into structured docs:

  - `docs/architecture.md` — Attest module architecture, domain model, data flow (extract from existing plans and README)
  - `docs/testing-strategy.md` — testing layers, what each layer covers, how to run (extract from README "Testing approach" section)
  - `docs/releasing.md` — how to cut a release, versioning policy, npm publish workflow (new, based on Weave's releasing.md pattern)

  Keep `.weave/plans/` files in place — they are historical planning artifacts, not documentation. The `docs/` files should be living documentation about the current system.
  **Files**:
    - `docs/architecture.md` (new)
    - `docs/testing-strategy.md` (new)
    - `docs/releasing.md` (new)
  **Acceptance**: `docs/` directory exists with 3 documentation files.

- [x] 15. Update `.gitignore`
  **What**: Update `.gitignore` to match Weave's conventions plus Attest-specific entries:
  ```
  dist/
  coverage/
  node_modules/
  .DS_Store
  /tmp/
  *.log
  bun.lockb

  # npm auth (never commit tokens)
  .npmrc.local

  # Attest runtime state
  .attest/runs/

  # Weave runtime state (execution state, not plans)
  .weave/*
  !.weave/plans/
  !.weave/designs/
  ```
  Remove the old `.opencode/node_modules/` and `.weave/runtime/` entries (covered by broader patterns). Keep `.attest/runs/` exclusion.
  **Files**:
    - `.gitignore` (rewrite)
  **Acceptance**: `git status` doesn't show `dist/`, `node_modules/`, or `.attest/runs/` as untracked.

- [x] 16. Update README.md
  **What**: Update the README to reflect the new project structure. Key changes:
  - Update "Repository layout" section to show `src/`, `test/`, `evals/`, `script/`, `docs/`, `dist/` structure
  - Update "Running the pilot locally" to include `bun run build`
  - Update test commands to use new script names (`bun run test:unit`, etc.)
  - Update "Current status" to reflect the restructured layout
  - Remove references to `.opencode/plugins/attest/` as the source location
  - Add build instructions
  **Files**:
    - `README.md` (update)
  **Acceptance**: README accurately describes the current project structure and commands.

- [x] 17. Clean up `.opencode/` workspace
  **What**: Simplify the `.opencode/` directory now that source has moved to `src/`:
  - `.opencode/package.json` — keep minimal, remove `@opencode-ai/plugin` dep (moved to root), keep only what OpenCode workspace discovery needs. If the workspace is no longer needed (root package.json has the dep), remove the `workspaces` field from root `package.json` and simplify `.opencode/package.json` to just `name` and `type`.
  - `.opencode/tsconfig.json` — update to only cover `plugins/attest.ts` (the shim file), or remove if the root tsconfig covers it
  - `.opencode/.gitignore` — keep as-is (ignores generated files in .opencode)
  - `.opencode/commands/attest.md` — keep as-is (slash command spike)
  - `.opencode/tui.json` — keep as-is (plugin discovery)

  Evaluate whether `.opencode` still needs to be a Bun workspace member. If `@opencode-ai/plugin` is in the root `package.json`, the workspace may be unnecessary. However, OpenCode may expect `.opencode/package.json` to exist for plugin resolution — test this.
  **Files**:
    - `.opencode/package.json` (simplify)
    - `.opencode/tsconfig.json` (update or remove)
    - `package.json` (potentially remove `workspaces` field)
  **Acceptance**: `bun install` succeeds. Plugin still loads via OpenCode. No duplicate dependency declarations.

- [x] 18. Update `devDependencies`
  **What**: Align devDependencies with Weave's versions:
  - Add `bun-types` (Weave uses `^1.3.11`) — needed for `types: ["bun-types"]` in tsconfig
  - Keep `typescript` (consider upgrading to match Weave's `^6.0.2` if compatible, otherwise keep `^5.8.3`)
  - Keep `@types/bun` and `@types/node` if still needed, or replace with `bun-types`
  - Move `@opencode-ai/plugin` to root `dependencies` (from `.opencode/package.json`)
  - Evaluate `@opentui/core` and `@opentui/solid` — if used in source, they're `dependencies`; if only in the TUI entry shim, they stay in `.opencode/package.json`
  **Files**:
    - `package.json` (update deps)
  **Acceptance**: `bun install` succeeds. `bun run typecheck` passes. No missing type definitions.

## Verification

- [x] `bun run build` produces `dist/index.js` and `dist/index.d.ts`
- [x] `bun run typecheck` passes with zero errors
- [x] `bun test src/` passes all 24 co-located unit tests
- [x] `bun test test/integration/` passes all 7 integration tests (8 pass across 7 files)
- [x] `bun test test/e2e/` passes all 10 e2e tests (13 pass across 10 files)
- [x] `bun test` passes the full suite (66 tests, 41 files)
- [x] `bun run evals` runs the eval suite successfully
- [x] No source files remain in `.opencode/plugins/attest/` (only the shim at `.opencode/plugins/attest.ts`)
- [x] No test files remain in `tests/` (directory deleted)
- [x] `.opencode/tui.json` → `./plugins/attest.ts` plugin loading path works
- [x] `git status` shows clean working tree after all changes committed
- [x] All CI workflow YAML files are valid
