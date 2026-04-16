# Architecture

Attest is a comprehension gate for AI-assisted development, built as an OpenCode **server plugin**.

## Module Structure

```text
src/
  index.ts              Package entry point — re-exports plugin and public types
  entry-server.ts       OpenCode server plugin registration (commands, hooks, tool)
  types.ts              Shared type definitions and constants

  commands/             Server plugin command and tool definitions
    definitions.ts      Command templates for /attest and /attest-resume
    execute-handler.ts  command.execute.before handler (diff, risk, questions)
    submit-tool.ts      attest_submit tool (answer evaluation, evidence writing)

  config/               Configuration loading
    load-config.ts      Reads .attest/config.json with defaults

  domain/               Core domain models (pure, no I/O)
    diff-context.ts     Diff context representation
    evidence.ts         Evidence artifact model
    risk.ts             Risk level definitions
    session.ts          Session state model
    verdict.ts          Verdict types and constructors

  evidence/             Evidence artifact writing
    pathing.ts          Output path resolution
    write-json.ts       JSON evidence serialization
    write-markdown.ts   Markdown evidence rendering

  flow/                 Orchestration flows
    build-interview-plan.ts   Interview plan construction
    collect-intent.ts         Intent collection from user
    run-attest.ts             Primary attest flow
    run-resume.ts             Session resume flow

  git/                  Git integration
    collect-diff-context.ts   Diff collection from working tree
    resolve-diff-target.ts    Target resolution (staged, branch, etc.)
    shared.ts                 Shared git utilities
    truncate-diff.ts          Large diff truncation

  llm/                  LLM contract layer
    client.ts                 LLM client abstraction
    evaluate-answers.ts       Answer evaluation via LLM
    fallbacks.ts              Fallback behavior for LLM failures
    generate-questions.ts     Question generation via LLM
    opencode-session-client.ts  OpenCode SDK session-based client
    schema.ts                 JSON schema definitions for LLM I/O
    prompts/
      index.ts          Inlined prompt constants (no runtime file reads)

  path/                 Path utilities
    safe-paths.ts       Safe path construction and validation

  policy/               Deterministic policy engine
    apply-escalation-rules.ts   Escalation rule application
    classify-risk.ts            Risk classification from diff context
    compute-verdict.ts          Verdict computation from evaluation
    select-interview-depth.ts   Interview depth selection by risk

  session/              Session persistence
    load-latest.ts      Load most recent session
    resume-run.ts       Resume interrupted session
    session-paths.ts    Session file path resolution
    store.ts            Session read/write operations

  ui/                   User interface rendering
    render-summary.ts        Summary display
    render-verdict.ts        Verdict display
```

## Data Flow

```
User runs /attest
  → command.execute.before hook (server-side, before LLM):
      → collect-diff-context (git diff)
      → classify-risk (deterministic)
      → select-interview-depth (deterministic)
      → generate-questions (LLM)
      → create session record (asking_questions)
      → inject interview context into output.parts
  → LLM presents questions to user conversationally
  → User answers questions in chat
  → LLM calls attest_submit tool:
      → evaluate-answers (LLM)
      → apply-escalation-rules (deterministic)
      → compute-verdict (deterministic)
      → write evidence artifacts (JSON + Markdown)
      → transition session to completed
      → return verdict string to LLM
  → LLM presents verdict to user
```

## Key Design Decisions

### Server Plugin Architecture

Attest is implemented as an OpenCode **server plugin** (not a TUI plugin). Server plugins:
- Are installable via `opencode.json`'s `plugin` array: `{ "plugin": ["@weaveio/opencode_attest"] }`
- Export a `server` async function that receives `PluginInput` and returns `Hooks`
- Can register slash commands, intercept command execution, and define custom tools

### Command + Tool Hybrid Pattern

The `/attest` slash command uses a hybrid approach:
1. **Command template** (`config.command`) — defines the slash command and instructs the LLM
2. **`command.execute.before` hook** — runs server-side before the LLM, injects diff analysis and questions
3. **`attest_submit` tool** — called by the LLM after collecting answers, evaluates and writes evidence

This pattern keeps `/attest` as a discoverable slash command while doing the heavy computation server-side.

### `config.command` Pattern

The `config.command` mutation pattern is code-proven in Weave's production plugin. The SDK's `Config` type includes a `command` property (`Record<string, { template, description?, agent?, model? }>`).

**Note**: While this property exists in the SDK types, it is not formally documented in OpenCode's public API. The smoke test in `test/e2e/config-command-registration.smoke.test.ts` verifies compatibility against `@opencode-ai/plugin@1.4.6` and will fail loudly if the contract changes.

The `config` hook defensively initializes `config.command` to `{}` before mutation to handle the case where no other plugin has set it yet.

### Deterministic vs LLM-backed

The policy engine (risk classification, escalation rules, verdict computation, interview depth) is fully deterministic. Only question generation and answer evaluation use LLM calls, behind a strict contract boundary.

### LLM Contract Layer

The `llm/client.ts` abstraction allows swapping between a stub client (for testing) and the OpenCode session-based client (for production). The contract is defined by typed input/output schemas.

### Prompt Asset Inlining

Prompt text is inlined as TypeScript string constants in `src/llm/prompts/index.ts` rather than loaded from `.md` files at runtime. This ensures:
- The built `dist/index.js` is self-contained (no runtime file reads)
- The `package.json#files: ["dist/"]` approach works without copying additional assets

### Evidence Artifacts

Attest writes durable evidence to `.attest/runs/` as both JSON (machine-readable) and Markdown (human-readable). Sessions are persisted to `.attest/sessions/` for resume support.
