<p align="center">
  <img src="attest.png" alt="Attest" width="200" />
</p>

<h1 align="center">Attest</h1>

<p align="center">
  <strong>Prove you understand the code before it ships.</strong>
</p>

<p align="center">
  A comprehension gate for AI-assisted development that verifies engineers genuinely understand the code they're about to merge — not just that it compiles.
</p>

---

## Why Attest exists

AI can write code faster than humans can internalize it. Code can compile, pass tests, and look perfectly reasonable — while the engineer who submitted it can't explain what it does under load, what assumptions it relies on, or how to debug it at 2am.

Attest closes that gap. It's a comprehension gate that interviews you about your actual diff, scales question depth to risk level, and leaves behind auditable evidence of understanding. Not a linter. Not a test suite. A proof that a human is in the loop — and actually in command.

## What Attest does

Attest is an **OpenCode plugin** that conducts a targeted interview grounded in your actual code diff before a pull request is opened.

- **Inspects** your local code changes
- **Classifies risk** — sensitive changes (auth, crypto, billing, migrations) get deeper scrutiny
- **Asks targeted questions** — calibrated to the change's risk level (2–6 questions)
- **Evaluates answers** — assesses whether understanding is genuine
- **Records evidence** — writes durable, auditable artifacts (JSON + Markdown)
- **Returns a verdict** — `PASS`, `PASS_WITH_WARNINGS`, `NEEDS_FOLLOWUP`, `ESCALATE_TO_HUMAN`, or `BLOCK`

## How it works

```
/attest
  → Declare intent (summary, motivation, AI disclosure)
  → Diff collected (staged or branch)
  → Risk classified (deterministic pattern matching)
  → Interview depth selected (low: 2, medium: 4, high: 6 questions)
  → Questions generated (grounded in actual diff)
  → Answers collected (interactive)
  → Answers evaluated
  → Escalation rules applied (deterministic)
  → Verdict computed (deterministic)
  → Evidence artifacts written
  → Verdict rendered
```

## Key features

| Feature | Detail |
|---------|--------|
| **Risk-aware depth** | Low-risk (docs, tests): 2 questions. Medium (business logic): 4. High (auth, crypto, billing): 6. |
| **Deterministic policy** | Risk classification, verdict computation, and escalation rules are fully deterministic and auditable. |
| **Durable evidence** | Machine-readable JSON and human-readable Markdown artifacts for every run. |
| **Session resume** | Interrupted interviews can be resumed without starting over. |
| **Strict LLM contract** | LLM calls are behind a contract boundary with schema validation — behavior stays predictable. |
| **Intent declaration** | Engineers declare their change summary, motivation, and AI usage upfront. |

## Commands

| Command | Description |
|---------|-------------|
| `/attest` | Run against staged changes (default) |
| `/attest branch` | Run against current branch diff |
| `/attest resume` | Resume an interrupted session |

## Installation

This package is published on [npm](https://www.npmjs.com/package/@pgermishuys/opencode_attest).

### Prerequisites

- [OpenCode](https://opencode.ai)

### Step 1: Add to opencode.json

Add the plugin to your `opencode.json` file:

```json
{
  "plugin": ["@pgermishuys/opencode_attest"]
}
```

### Step 2: Restart OpenCode

OpenCode automatically installs npm plugins at startup — no manual `bun add` or `npm install` required. The plugin loads automatically upon restart and works with zero configuration out of the box.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `404 Not Found` | Ensure the package name is correct: `@pgermishuys/opencode_attest`. |
| Package not found after publish | npm can take a few minutes to propagate. Wait and retry. |

## Uninstalling

### Step 1: Remove from opencode.json

Delete the `@pgermishuys/opencode_attest` entry from the `plugin` array in your `opencode.json`.

### Step 2: Clean up artifacts (optional)

Remove Attest runtime state if no longer needed:

```bash
rm -rf .attest/
```

## Development

- **Build**: `bun run build`
- **Test**: `bun test`
- **Typecheck**: `bun run typecheck`

See [docs/testing-strategy.md](docs/testing-strategy.md) for details.

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

## Evidence artifacts

Attest writes local artifacts under:

- `.attest/runs/*.json` — machine-readable evidence
- `.attest/runs/*.md` — human-readable evidence
- `.attest/sessions/*.json` — interrupted session state

## Design principles

- **Understanding over output** — passing tests ≠ understanding the change
- **Evidence over intuition** — leave behind durable records, not just verdicts
- **Risk-based, not uniform** — sensitive changes get deeper scrutiny
- **Local-first for the pilot** — keep close to the developer workflow
- **Structured, not ad hoc** — grounded in actual diff and declared intent

## Deterministic vs LLM-backed

| Layer | Scope |
|-------|-------|
| **Deterministic** | Diff inspection, config loading, risk classification, escalation rules, verdict policy, session persistence, evidence writing |
| **LLM-backed** | Question generation, answer evaluation (behind strict contract boundary with schema validation) |

See [docs/architecture.md](docs/architecture.md) for details.

## Relationship to Weave

Attest fits naturally with Weave's structured workflow model. Where Weave adds planning, review, orchestration, and auditability to AI coding workflows, Attest focuses on one question:

> **Can the person submitting this change actually explain and own it?**

- Weave: https://tryweave.io/
- OpenCode Weave: https://github.com/pgermishuys/opencode-weave

## Documentation

- [Architecture](docs/architecture.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Releasing](docs/releasing.md)

---

<p align="center">
  <strong>Attest — because compiling isn't understanding.</strong>
</p>
