# Attest OpenCode Plugin Pilot

## Purpose

This document captures the current implementation direction for **Attest** as an **OpenCode plugin**.

The goal of the pilot is simple: validate whether a slash-command-based comprehension gate can reliably help an engineer prove they understand the code they are about to submit.

This is a **speed-of-learning** plan, not a full product architecture.

---

## Decision summary

We are choosing an **OpenCode-first** pilot over the earlier standalone CLI-first direction.

Why:

- most intended users already work inside OpenCode
- the comprehension gate needs a stateful question/answer loop
- slash commands provide a fast path to real usage
- we want the shortest path to learning whether the workflow is credible and tolerable

This pilot should optimize for **workflow fit**, not cross-platform portability.

---

## What Attest needs to prove

The pilot should answer a small set of product questions:

1. Will engineers actually run `/attest` before submitting work?
2. Do the generated questions expose real misunderstanding?
3. Does the resulting verdict feel fair and useful?
4. Is the interaction short enough to become part of normal development flow?
5. Does the evidence artifact feel useful to the engineer and to later human review?

---

## Scope boundaries

### In scope

- an OpenCode plugin that adds `/attest`
- local diff inspection
- intent capture and AI usage disclosure
- deterministic local risk classification
- LLM-generated comprehension questions
- LLM-assisted answer evaluation
- local evidence artifact generation
- a small verdict vocabulary
- test coverage across deterministic logic and plugin flow

### Out of scope for the pilot

- GitHub App or PR comment workflow
- centralized backend service
- org-wide policy management
- IDE integrations outside OpenCode
- merge enforcement in CI
- multi-platform plugin support

---

## OpenCode implementation choice

OpenCode supports lightweight slash commands via command markdown files and richer command surfaces via **TUI plugins**.

Because Attest needs session state, local evidence writing, richer flow control, and room for future custom UI, the pilot should be planned as an **OpenCode TUI plugin**.

### Practical note

As a short spike, we can still prototype the core interview prompt as a `.opencode/commands/attest.md` command to validate tone and flow quickly.

But the target pilot implementation should be a **plugin**, not just a prompt file.

### Spike findings

The command-spike shape is useful for validating:

- the tone of the interview
- the default scope selection model
- the verdict vocabulary
- whether a short question loop feels natural in OpenCode

The command-spike shape is not sufficient for the real pilot because it does not own:

- resumable session state
- evidence artifact creation
- deterministic policy boundaries
- richer command behavior such as `/attest resume`

So the markdown command should remain a learning tool only, while the implementation target stays a TUI plugin.

---

## Pilot invocation model

### Primary command

- `/attest`

### Likely subcommands

- `/attest` — run against the default change set
- `/attest branch` — run against the current branch diff
- `/attest resume` — resume an interrupted Attest session
- `/attest help` — explain the flow and available options

### Default behavior

The default should be intentionally simple:

1. inspect the active change set
2. summarize what Attest will evaluate
3. collect intent and AI disclosure
4. classify risk deterministically
5. ask targeted comprehension questions
6. evaluate answers
7. return a verdict and write evidence locally

### Resume behavior

If a session is interrupted, `/attest resume` should:

- load the most recent incomplete session
- restore question/answer state
- continue from the next unanswered step
- preserve the same evidence record lineage

---

## User flow inside OpenCode

### Happy path

1. engineer runs `/attest`
2. Attest gathers repo and diff context
3. Attest asks the engineer to describe the change and disclose AI usage
4. Attest assigns a deterministic risk level
5. Attest generates a small set of comprehension questions grounded in the diff
6. engineer answers in the OpenCode session
7. Attest evaluates whether the answers show genuine understanding
8. if needed, Attest asks one follow-up
9. Attest emits a verdict and writes an evidence artifact

### Example verdicts

- `PASS`
- `PASS_WITH_WARNINGS`
- `NEEDS_FOLLOWUP`
- `ESCALATE_TO_HUMAN`
- `BLOCK`

---

## Minimal plugin architecture

The pilot should keep the architecture small and explicit.

### 1. TUI plugin entrypoint

Responsible for:

- registering `/attest`
- wiring command selection to the Attest flow
- handling plugin lifecycle inside OpenCode

### 2. Diff context collector

Responsible for:

- determining the target diff
- summarizing changed files and change scope
- producing normalized context for later steps

### 3. Interview/session state manager

Responsible for:

- tracking the current Attest run
- storing answered and unanswered questions
- supporting resume behavior
- preventing partial sessions from being lost silently

### 4. Risk engine

Responsible for:

- deterministic local risk classification
- mandatory escalation for sensitive categories
- deciding interview depth

### 5. LLM interviewer/evaluator

Responsible for two model-assisted steps only:

- generate questions grounded in the diff and declared intent
- evaluate answers for evidence of understanding

### 6. Evidence writer

Responsible for:

- writing a durable local artifact
- recording inputs, questions, answers, verdict, and rationale
- supporting later review and future CI/PR integration

---

## Deterministic vs LLM responsibilities

### Deterministic in code

- slash-command registration
- session lifecycle and resume logic
- git/diff inspection
- file/path-based risk heuristics
- mandatory escalation policy
- verdict threshold policy
- evidence file creation
- config loading

### LLM-assisted

- question generation
- answer evaluation
- optional follow-up question generation when the result is inconclusive

The pilot should not hand overall control of the workflow to the LLM.

---

## Local files and config for the pilot

### OpenCode plugin wiring

- `.opencode/tui.json`
- plugin source entrypoint under `.opencode/plugins/` during local development, or packaged equivalent

### Attest config

Suggested:

- `.attest/config.json`

Initial config should cover:

- default diff mode
- base branch
- risk thresholds
- evidence output path
- maximum question count by risk level
- whether follow-up questions are enabled

### Evidence output

Suggested:

- `.attest/runs/<timestamp>.json`
- `.attest/runs/<timestamp>.md`

These artifacts should capture:

- diff target
- changed files summary
- declared intent
- AI usage disclosure
- risk classification
- questions asked
- answers given
- verdict
- rationale
- escalation flags

### Session persistence

The current pilot also persists interrupted sessions under:

- `.attest/sessions/<session-id>.json`

This supports `/attest resume` without requiring a backend service.

---

## Language and implementation direction

The original concept work assumed a .NET CLI.

For the OpenCode plugin pilot, the practical implementation language should be **TypeScript**, aligned with OpenCode's plugin model and local development workflow.

To preserve future portability, the Attest flow should still be organized as separable modules rather than one large plugin file.

That means:

- keep policy/risk/evidence logic independent of plugin glue
- keep prompts and evaluation contracts isolated
- keep OpenCode-specific wiring at the boundary

---

## Testing strategy

Attest should adopt a testing strategy similar in spirit to Weave:

### 1. Unit tests

Use unit tests for deterministic logic:

- risk classification
- verdict thresholding
- session state transitions
- evidence formatting/writing
- config parsing

These tests should be the bulk of our code coverage.

### 2. Integration tests

Use temporary project fixtures to test:

- repo-local config loading
- diff selection behavior
- evidence output paths
- interaction between session, policy, and artifact writing

### 3. End-to-end plugin tests

Add E2E coverage for:

- plugin loading
- slash-command registration
- `/attest` happy path
- interrupted session + `/attest resume`
- escalation path for high-risk changes

Where possible, use a fake-host approach for deterministic session-flow testing.

### 4. Real plugin smoke tests

Add at least one smoke test that boots OpenCode with the plugin configured and verifies the command is available.

### 5. Behavioral evals

Treat LLM-dependent quality as a separate layer:

- question relevance
- answer-evaluation consistency
- escalation reasonableness

These should be tracked with non-blocking evals rather than hard deterministic assertions.

### Coverage target

For deterministic modules, aim for strong coverage on the core logic, especially risk, verdict, session, and evidence paths.

The target is not coverage for its own sake. The target is confidence that policy and workflow do not drift silently.

### Current implementation note

The current pilot scaffold now includes:

- deterministic unit coverage for policy, evidence, session, and diff logic
- integration coverage with temporary git fixtures
- end-to-end coverage for low-, medium-, and high-risk Attest flows
- smoke checks for local plugin-load metadata
- non-blocking evals for the stub LLM contract layer

---

## Key risks and unknowns

### Product risks

- engineers may see `/attest` as friction instead of support
- verdicts may feel arbitrary if question quality is weak
- the flow may be too slow for routine low-risk changes

### Technical risks

- plugin APIs may shape the UX more than expected
- resume/state persistence may be awkward inside the host model
- diff context may need truncation strategies for large changes

### Evaluation risks

- the LLM may over-credit vague answers
- the LLM may hallucinate concerns not present in the diff
- question generation may drift away from the actual changed code

---

## Validation questions for the pilot

We should explicitly measure:

- invocation rate: how often do users run `/attest` voluntarily?
- completion rate: how often do they finish the flow?
- follow-up rate: how often is one follow-up needed?
- disagreement rate: how often do humans think the verdict was wrong?
- time cost: how long does a typical Attest session take?
- evidence usefulness: do reviewers find the artifact helpful?

---

## Recommended implementation sequence

### Phase 0 — prompt spike

Create a very small `.opencode/commands/attest.md` spike to validate:

- tone
- question style
- likely prompt structure

This is a throwaway learning step if needed.

### Phase 1 — smallest viable plugin

Build a TUI plugin that:

- registers `/attest`
- captures intent + AI disclosure
- asks a small fixed number of questions
- writes a local evidence artifact

No resume, no complex risk model yet.

### Phase 2 — risk-based flow

Add:

- deterministic risk classification
- variable question depth by risk
- escalation rules for sensitive categories
- branch diff selection

### Phase 3 — state and resume

Add:

- resumable sessions
- follow-up question support
- stronger artifact structure

### Phase 4 — hardening and measurement

Add:

- fake-host E2E coverage
- real plugin smoke tests
- non-blocking behavioral evals
- pilot instrumentation and qualitative feedback collection

---

## Smallest viable slice

If we optimize aggressively for speed of learning, the smallest viable slice is:

- a TUI plugin that registers `/attest`
- default change-set inspection
- intent capture
- 3 generated questions
- answer evaluation
- local JSON artifact
- one happy-path E2E test

That is enough to learn whether the interaction model is promising before investing in richer policy and portability work.
