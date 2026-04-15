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

Attest is being planned as an **OpenCode plugin** with a slash-command interface.

The pilot shape is intentionally simple:

- run inside the developer workflow
- inspect local code changes
- ask targeted comprehension questions
- evaluate whether understanding appears genuine
- write a durable evidence record

This is a fast-feedback pilot to test whether the workflow is useful, credible, and lightweight enough to adopt.

The current direction is to implement Attest as an **OpenCode TUI plugin** that registers `/attest` and owns the interactive session flow inside OpenCode.

## Pilot UX

The initial interaction model is centered on `/attest`.

### Primary commands

- `/attest` — run Attest against the default change set
- `/attest branch` — run Attest against the current branch diff
- `/attest resume` — resume an interrupted Attest session

The slash command is the primary pilot surface because it keeps the interaction in the developer's existing OpenCode workflow and gives the fastest feedback loop on whether the comprehension-gate model is a good fit.

### Expected flow

1. Attest inspects the relevant diff
2. The engineer states their intent and any AI usage disclosure
3. Attest classifies risk
4. Attest asks a small number of targeted questions
5. The engineer answers in-session
6. Attest evaluates the answers
7. Attest returns a verdict and writes an evidence artifact

Possible early verdicts:

- `PASS`
- `PASS_WITH_WARNINGS`
- `NEEDS_FOLLOWUP`
- `ESCALATE_TO_HUMAN`
- `BLOCK`

## Design principles

- **Understanding over output** — passing tests is not the same as understanding the change
- **Evidence over intuition** — Attest should leave behind a durable record
- **Risk-based, not uniform** — sensitive changes should be treated differently
- **Local-first for the pilot** — keep the first version close to the developer workflow
- **Structured, not ad hoc** — the interview should be grounded in the actual diff and declared intent

## Pilot implementation direction

Attest is being planned as an **OpenCode-first pilot**, not a standalone CLI.

That means:

- use OpenCode plugin primitives and slash-command registration
- keep deterministic policy, risk, and evidence logic separate from LLM judgment
- preserve portability where practical, but optimize the pilot for OpenCode users first

The current working plan lives here:

- [OpenCode plugin pilot plan](.weave/plans/attest-opencode-plugin-pilot.md)

## Testing approach

Attest should follow the same basic discipline used elsewhere in Weave:

- **unit tests** for deterministic policy, risk, session, and evidence logic
- **integration tests** using temporary project fixtures
- **end-to-end tests** for the `/attest` OpenCode flow
- **real plugin smoke tests** to verify loading and command registration
- **non-blocking evals** for LLM-dependent question quality and verdict behavior

The goal is confidence in the plugin workflow without pretending model behavior can be proved by deterministic tests alone.

## Relationship to Weave

Attest fits naturally with Weave's structured workflow model.

Where Weave adds planning, review, orchestration, and auditability to AI coding workflows, Attest focuses on a narrower question:

**Can the person submitting this change actually explain and own it?**

Attest is not meant to replace coding assistants or agent harnesses. It is meant to extend them with a verification layer.

- Weave: https://tryweave.io/
- OpenCode Weave: https://github.com/pgermishuys/opencode-weave

## Current status

This repository now contains an **OpenCode plugin pilot scaffold** for Attest.

Current status:

- local OpenCode plugin workspace under `.opencode/`
- slash-command spike at `.opencode/commands/attest.md`
- TUI plugin scaffold that registers Attest commands
- deterministic diff, risk, verdict, evidence, and session modules
- resumable Attest flow with local evidence artifacts
- stub-backed LLM contract layer and behavioral eval harness

The pilot is still intentionally incomplete, but it is now runnable and testable.

## Repository layout

```text
.opencode/
  commands/                 throwaway slash-command spike
  plugins/attest/           plugin implementation
tests/
  unit/                     deterministic logic
  integration/              fixture-based repo flows
  e2e/                      end-to-end Attest scenarios
  smoke/                    plugin-load smoke checks
  evals/                    non-blocking behavioral evals
.attest/
  config.example.json       sample pilot config
```

## Running the pilot locally

### 1. Install dependencies

```bash
bun install
```

### 2. Open the repo in OpenCode

With this repository as the working directory, OpenCode will pick up:

- `.opencode/tui.json`
- `.opencode/plugins/attest.ts`
- `.opencode/commands/attest.md`

### 3. Run Attest

Current pilot command surfaces:

- `/attest`
- `Attest branch`
- `Attest resume`

The TUI plugin is the real target surface.
The markdown command is a temporary spike for flow validation.

## Evidence artifacts

Attest writes local artifacts under:

- `.attest/runs/*.json`
- `.attest/runs/*.md`

Interrupted sessions are stored under:

- `.attest/sessions/*.json`

## Testing

### Deterministic test layers

```bash
bun run test:unit
bun run test:integration
bun run test:e2e
bun run test:smoke
```

### Full deterministic suite

```bash
bun run test
```

### Typecheck

```bash
bun run typecheck
```

### Behavioral evals

```bash
bun run evals
```

Behavioral evals are **non-blocking**. They are intended to track question quality and verdict behavior over time, not to act as hard correctness proofs.

## Deterministic vs LLM-backed behavior

### Deterministic

- diff inspection
- config loading
- risk classification
- escalation rules
- verdict policy
- session persistence
- evidence writing

### LLM-backed

- interview question generation
- answer evaluation
- follow-up question generation later

Today the pilot uses a **stub LLM client** behind a strict contract boundary. This keeps the flow testable while the live provider integration remains unfinished.

Related design notes:

- [OpenCode plugin pilot plan](.weave/plans/attest-opencode-plugin-pilot.md)
- [Execution plan](.weave/plans/attest-opencode-plugin-pilot-execution-plan.md)
- [Executive summary](.weave/plans/comprehension-gate-pilot-executive-summary.md)
- [Pilot handoff](.weave/plans/comprehension-gate-pilot-handoff.md)

## Working definition

**Attest helps teams prove human understanding and ownership before AI-assisted code moves forward.**
