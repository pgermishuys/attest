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

Attest is an **OpenCode server plugin** with a slash-command interface.

- runs inside the developer workflow
- inspects local code changes
- asks targeted comprehension questions conversationally
- evaluates whether understanding appears genuine
- writes a durable evidence record

## Installation

Add Attest to your `opencode.json`:

```json
{
  "plugin": ["@weave/attest-opencode-plugin"]
}
```

## Usage

### Slash commands

- `/attest` — run Attest against staged changes
- `/attest branch` — run Attest against the current branch diff (vs main)
- `/attest-resume` — resume an interrupted Attest session

### Expected flow

```
User: /attest
Attest: "I've analyzed your staged changes. Here's the comprehension interview:
         Risk level: medium (2 files changed, touches business logic)

         Question 1/3: How does the new validation flow handle edge cases?
         Question 2/3: What assumption does the service make about request ordering?
         Question 3/3: What would you check first if this broke in production?"
User: [answers each question in conversation]
Attest: [calls attest_submit tool with session_id and collected answers]
Attest: "Verdict: PASS — all 3 answers demonstrate solid understanding.
         Evidence written to .attest/runs/2026-04-15T16-30-00.000Z.json"
```

### Command/Tool Contract

1. `/attest` triggers a `command.execute.before` hook that:
   - Inspects the staged (or branch) diff
   - Classifies risk
   - Generates comprehension questions
   - Creates a session record
   - Injects interview context into the LLM message

2. The LLM presents questions to the user and collects answers conversationally.

3. The LLM calls the `attest_submit` tool with:
   - `session_id` — the session ID from the interview context
   - `answers` — array of `{ question_id, answer }` (user's verbatim answers)

4. The tool evaluates answers, writes evidence, and returns a verdict.

Possible verdicts: `PASS`, `PASS_WITH_WARNINGS`, `NEEDS_FOLLOWUP`, `ESCALATE_TO_HUMAN`, `BLOCK`

## Repository layout

```text
src/                    Source code with co-located unit tests
  commands/             Server plugin command and tool definitions
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
  e2e/                  End-to-end and plugin loading tests
  integration/          Fixture-based integration tests
  testkit/              Shared test fixtures and utilities
evals/                  Behavioral eval harness
script/                 Build scripts
docs/                   Architecture and strategy documentation
dist/                   Build output (generated)
.attest/
  config.example.json   Sample pilot config
```

## Development

### 1. Install dependencies

```bash
bun install
```

### 2. Build

```bash
bun run build
```

### 3. Testing

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

The production plugin uses OpenCode's session-based LLM client. Tests use a stub client behind the same contract boundary. See [docs/architecture.md](docs/architecture.md) for details.

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
