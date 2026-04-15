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

Attest is currently being explored as an **OpenCode plugin** with a slash-command interface.

The pilot shape is intentionally simple:

- run inside the developer workflow
- inspect local code changes
- ask targeted comprehension questions
- evaluate whether understanding appears genuine
- write a durable evidence record

This is a fast-feedback pilot to test whether the workflow is useful, credible, and lightweight enough to adopt.

## Pilot UX

The initial interaction model is centered on `/attest`.

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

## Relationship to Weave

Attest fits naturally with Weave's structured workflow model.

Where Weave adds planning, review, orchestration, and auditability to AI coding workflows, Attest focuses on a narrower question:

**Can the person submitting this change actually explain and own it?**

Attest is not meant to replace coding assistants or agent harnesses. It is meant to extend them with a verification layer.

- Weave: https://tryweave.io/
- OpenCode Weave: https://github.com/pgermishuys/opencode-weave

## Current status

This repository is in the **pilot design** stage.

The core implementation is not scaffolded yet. Current materials are focused on shaping the product, workflow, and interaction model.

Related design notes:

- [Executive summary](.weave/plans/comprehension-gate-pilot-executive-summary.md)
- [Pilot handoff](.weave/plans/comprehension-gate-pilot-handoff.md)

## Working definition

**Attest helps teams prove human understanding and ownership before AI-assisted code moves forward.**
