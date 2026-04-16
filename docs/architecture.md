# Architecture

Attest is a comprehension gate for AI-assisted development, built as an OpenCode TUI plugin.

## Module Structure

```text
src/
  index.ts              Package entry point — re-exports plugin and public types
  entry.ts              OpenCode TUI plugin registration (commands, slash commands)
  types.ts              Shared type definitions and constants

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
      evaluate-interview.md   System prompt for answer evaluation
      generate-interview.md   System prompt for question generation

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
    collect-interactive.ts   Interactive answer collection
    render-summary.ts        Summary display
    render-verdict.ts        Verdict display
```

## Data Flow

```
User runs /attest
  → collect-intent (intent + AI disclosure)
  → collect-diff-context (git diff)
  → classify-risk (deterministic)
  → select-interview-depth (deterministic)
  → generate-questions (LLM)
  → collect-interactive (user answers)
  → evaluate-answers (LLM)
  → apply-escalation-rules (deterministic)
  → compute-verdict (deterministic)
  → write evidence artifacts (JSON + Markdown)
  → render verdict to user
```

## Key Design Decisions

### Deterministic vs LLM-backed

The policy engine (risk classification, escalation rules, verdict computation, interview depth) is fully deterministic. Only question generation and answer evaluation use LLM calls, behind a strict contract boundary.

### LLM Contract Layer

The `llm/client.ts` abstraction allows swapping between a stub client (for testing) and the OpenCode session-based client (for production). The contract is defined by typed input/output schemas, not by prompt details.

### Plugin Entry Point

The OpenCode plugin entry point lives at `.opencode/plugins/attest.ts` and imports from `src/entry.ts`. This preserves OpenCode's plugin discovery mechanism (`.opencode/tui.json` → `./plugins/attest.ts`) while keeping source in the standard `src/` layout.

### Evidence Artifacts

Attest writes durable evidence to `.attest/runs/` as both JSON (machine-readable) and Markdown (human-readable). Sessions are persisted to `.attest/sessions/` for resume support.
