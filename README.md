# Attest

**Attest is a comprehension gate for AI-assisted development.**

It helps engineers prove they understand the code they are about to submit.

Built as part of the **Weave** ecosystem, Attest adds a structured verification step before work moves forward. The goal is not to slow teams down. The goal is to preserve **ownership, clarity, and trust** when AI can generate code faster than humans fully internalize it.

## Why Attest exists

AI-assisted coding changes the speed of delivery.

It also creates a new failure mode: code can compile, pass tests, and look plausible even when the submitting engineer cannot clearly explain:

- how the change works
- what assumptions it relies on
- what could fail in production
- how it should be debugged, reviewed, or owned after merge

Attest is designed to close that gap.

Before a pull request is opened, Attest asks the engineer to explain the change in a short, structured interview grounded in the actual diff. It then records evidence and returns a verdict.

## What Attest is

Attest is an **OpenCode TUI plugin** with a slash-command interface.

- runs inside the developer workflow
- inspects local code changes
- asks targeted comprehension questions
- evaluates whether understanding appears genuine
- writes a durable evidence record

## Pilot UX

### Primary commands

- `/attest` — run Attest against the default change set
- `/attest branch` — run Attest against the current branch diff
- `/attest resume` — resume an interrupted Attest session

### Expected flow

1. Attest inspects the relevant diff
2. The engineer states their intent and any AI usage disclosure
3. Attest classifies risk
4. Attest asks a small number of targeted questions
5. The engineer answers in-session
6. Attest evaluates the answers
7. Attest returns a verdict and writes an evidence artifact

Possible verdicts: `PASS`, `PASS_WITH_WARNINGS`, `NEEDS_FOLLOWUP`, `ESCALATE_TO_HUMAN`, `BLOCK`

## Repository layout

```text
src/                    Source code with co-located unit tests
  config/               Configuration loading
  domain/               Core domain models
  evidence/             Evidence artifact writing
  flow/                 Orchestration flows
  git/                  Git integration
  llm/                  LLM contract layer
  path/                 Path utilities
  policy/               Deterministic policy engine
  session/              Session persistence
  ui/                   User interface rendering
test/
  integration/          Fixture-based integration tests
  e2e/                  End-to-end and plugin loading tests
  testkit/              Shared test fixtures and utilities
evals/                  Behavioral eval harness
  cases/                Eval case definitions
script/                 Build scripts
docs/                   Architecture and strategy documentation
dist/                   Build output (generated)
.opencode/
  plugins/attest.ts     Plugin entry shim
  tui.json              Plugin discovery config
  commands/             Slash command spike
.attest/
  config.example.json   Sample pilot config
```

## Getting started

### 1. Install dependencies

```bash
bun install
```

### 2. Build

```bash
bun run build
```

### 3. Open the repo in OpenCode

With this repository as the working directory, OpenCode will pick up:

- `.opencode/tui.json`
- `.opencode/plugins/attest.ts`
- `.opencode/commands/attest.md`

### 4. Run Attest

- `/attest`
- `/attest branch`
- `/attest resume`

## Testing

```bash
# All tests (unit + integration + e2e)
bun test

# Individual layers
bun run test:unit
bun run test:integration
bun run test:e2e

# Typecheck
bun run typecheck

# Behavioral evals (non-blocking)
bun run evals
```

See [docs/testing-strategy.md](docs/testing-strategy.md) for details.

## Evidence artifacts

Attest writes local artifacts under:

- `.attest/runs/*.json` — machine-readable evidence
- `.attest/runs/*.md` — human-readable evidence
- `.attest/sessions/*.json` — interrupted session state

## Design principles

- **Understanding over output** — passing tests is not the same as understanding the change
- **Evidence over intuition** — Attest should leave behind a durable record
- **Risk-based, not uniform** — sensitive changes should be treated differently
- **Local-first for the pilot** — keep the first version close to the developer workflow
- **Structured, not ad hoc** — the interview should be grounded in the actual diff and declared intent

## Deterministic vs LLM-backed behavior

### Deterministic

- diff inspection, config loading, risk classification, escalation rules, verdict policy, session persistence, evidence writing

### LLM-backed

- interview question generation, answer evaluation

The pilot uses a **stub LLM client** behind a strict contract boundary. See [docs/architecture.md](docs/architecture.md) for details.

## Relationship to Weave

Attest fits naturally with Weave's structured workflow model. Where Weave adds planning, review, orchestration, and auditability to AI coding workflows, Attest focuses on: **Can the person submitting this change actually explain and own it?**

- Weave: https://tryweave.io/
- OpenCode Weave: https://github.com/pgermishuys/opencode-weave

## Documentation

- [Architecture](docs/architecture.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Releasing](docs/releasing.md)

## Working definition

**Attest helps teams prove human understanding and ownership before AI-assisted code moves forward.**
