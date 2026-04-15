# Comprehension Gate Pilot Handoff

> Note (2026-04-15): this handoff captures the original CLI-first pilot direction. The current pilot direction has shifted to an **OpenCode plugin-first** approach centered on `/attest`. See [attest-opencode-plugin-pilot.md](./attest-opencode-plugin-pilot.md) for the active plan.

## Purpose

This document captures the current thinking, research findings, and implementation plan for building a **Comprehension Gate** pilot in a **separate repository**.

This repo is **not** intended to host the implementation. This document exists so the work can be transferred cleanly into a new .NET-focused repository.

---

## Summary

The goal is to prototype a **pre-PR comprehension gate** for AI-assisted software development.

The core idea is:

1. an engineer declares intent to submit code
2. the system inspects the diff and classifies risk
3. an LLM asks targeted comprehension questions
4. the engineer answers
5. the system evaluates whether the engineer appears to genuinely understand the change
6. the system records evidence and returns a verdict

The preferred pilot is:

- **CLI-based**
- **.NET 10 + C# 14**
- **local-first**
- designed to run **before PR creation**
- no Python requirement
- no GitHub PR comment workflow for v1

---

## Why this exists

The motivating governance problem is that AI can generate code faster than engineers fully internalize it.

That creates a failure mode where:

- code compiles
- tests pass
- review proceeds
- but no responsible human can clearly explain the implementation, failure modes, rollback behavior, or operational implications

This was described in the related research note in this repository as **Dark Code**.

The proposed response is a **Comprehension Gate**: a lightweight, risk-based control that checks whether a human can explain and own the change before it progresses.

---

## Internet research findings

### High-level conclusion

The exact phrase **“comprehension gate”** does **not** appear to be an established mainstream term in current industry practice.

However, the adjacent problem space is very real, and organizations are already using related controls:

- required human review
- CODEOWNERS
- branch protection
- AI-assisted code review guidance
- AI disclosure policies
- provenance and artifact attestation
- security/risk approval workflows

What appears to be missing in mainstream tooling is a strong, explicit mechanism to verify:

> “Can the submitting engineer actually explain this code before it enters review?”

### What industry is doing instead

Common patterns today:

- **human approval gates** rather than comprehension tests
- **ownership attestations** rather than demonstrated understanding
- **AI usage disclosure** rather than comprehension verification
- **build provenance** rather than author comprehension evidence

### Relevant references

- GitHub review guidance for AI-generated code:  
  https://docs.github.com/en/copilot/tutorials/review-ai-generated-code
- GitHub protected branches:  
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub CODEOWNERS:  
  https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- GitLab approval rules:  
  https://docs.gitlab.com/ee/user/project/merge_requests/approvals/rules.html
- GitHub artifact attestations:  
  https://docs.github.com/en/actions/concepts/security/artifact-attestations
- SLSA provenance:  
  https://slsa.dev/spec/v1.1/provenance
- Avocado AI policy:  
  https://avocado-framework.readthedocs.io/en/latest/guides/contributor/chapters/ai_policy.html
- InfluxData AI-generated code policy:  
  https://www.influxdata.com/ai-generated-code-contributions-policy/

### Key takeaway

The proposed approach here is more direct than current mainstream practice.

Most current controls verify that code was:

- reviewed
- approved
- attributed
- built from known sources

This proposal attempts to verify that the author can:

- explain the change
- describe important failure modes
- justify the approach
- own the code after merge

---

## Reference repo reviewed and rejected as the primary model

The repository reviewed was:

- https://github.com/islandbytesio/commit_comprehension_gate

### What that repository actually does

It is **not** a pre-commit hook.

It is a **GitHub Actions PR-time merge gate** that:

1. triggers when a PR is opened or updated
2. sends the PR diff to Claude
3. generates 3 multiple-choice questions
4. posts those questions in a PR comment
5. waits for the PR author to answer in comments
6. checks whether the answers match the stored answer key
7. sets a pass/fail commit status to block or allow merge

### Why this is not the preferred approach

Reasons this pattern was rejected for the pilot:

- it happens **after PR creation**, not before
- it is primarily a **merge gate**, not a pre-PR ownership gate
- it relies on **PR comments** as the interaction model
- it uses **multiple choice only**, which is easier to game
- it introduces a **Python implementation**, which is not desirable for the target environment
- it is optimized for GitHub workflow convenience, not for a .NET-native governance product

### What was still useful about it

It was useful as proof that:

- people are experimenting with the idea
- a lightweight gate can be operationalized
- merge enforcement through status checks is straightforward

But it should be treated as an inspiration point, not the implementation model.

---

## Preferred implementation direction

### Product shape

Build a **CLI-first pilot** in a **new repository**.

### Technology preferences

- **.NET 10**
- **C# 14**
- local CLI experience first
- provider-backed LLM calls from the CLI
- local evidence file for v1
- no ASP.NET requirement for the pilot

### Why CLI-first

CLI-first gives the fastest path to learning:

- no GitHub App complexity
- no web service required
- no central infra required on day one
- works as a genuine **pre-PR flow**
- keeps the interaction close to the engineer’s workflow

---

## Pilot workflow

The recommended v1 flow:

1. engineer runs a command such as `dotnet comprehension submit`
2. CLI inspects the current git diff relative to a base branch
3. CLI collects submission intent and AI usage disclosure
4. CLI performs deterministic local risk classification
5. CLI calls the LLM to generate comprehension questions
6. engineer answers the questions in the terminal
7. CLI calls the LLM to evaluate the answers
8. CLI optionally asks one follow-up if the evaluation is inconclusive
9. CLI writes a local evidence file and returns a verdict

Possible verdicts:

- `PASS`
- `PASS_WITH_WARNINGS`
- `NEEDS_FOLLOWUP`
- `ESCALATE_TO_HUMAN`
- `BLOCK`

---

## Where the LLM is involved

The LLM should be used as a **specialized interviewer/evaluator**, not as the entire system.

### LLM call 1: generate interview questions

Inputs:

- declared intent
- AI usage disclosure
- changed files
- diff summary or truncated diff
- risk classification

Output:

- targeted comprehension questions grounded in the change

### LLM call 2: evaluate answers

Inputs:

- intent
- diff context
- risk classification
- questions asked
- engineer’s answers

Output:

- per-answer rating
- overall verdict
- warnings or escalation recommendation
- optional follow-up question

### What stays deterministic in code

The following should remain normal C# logic:

- git inspection
- file/path risk heuristics
- mandatory escalation rules
- verdict threshold policy
- evidence file creation
- token generation

This keeps policy and enforcement deterministic even if the LLM is probabilistic.

---

## Risk model for the pilot

### Low risk

Examples:

- docs
- tests
- small refactors
- low-impact config changes

Interview depth:

- 1-2 questions

### Medium risk

Examples:

- business logic changes
- API behavior changes
- multi-file features

Interview depth:

- 3-4 questions
- include at least one failure-mode question

### High / critical risk

Examples:

- auth/authz
- tokens
- crypto
- secrets
- billing/financial logic
- migrations or destructive data changes
- infrastructure / deployment / CI/CD
- privacy / PII-sensitive workflows

Interview depth:

- 4-6 questions
- include failure-mode, rollback, and operational questions

### Mandatory human escalation

For the pilot, sensitive categories should trigger escalation regardless of score.

---

## Recommended v1 UX

Example command:

```bash
dotnet comprehension submit --base main
```

Example flow:

```text
Comprehension Gate
Repository: my-new-repo
Branch: feature/pre-pr-gate

Detected changes:
- 6 files changed
- Risk: Medium

Describe the change in 1-3 sentences:
> ...

Why are you submitting this?
> ...

Was AI used? [y/N]
> y

Approximate AI contribution?
> Medium

Generating questions...

Q1. ...
> ...

Q2. ...
> ...

Evaluating answers...

Verdict: PASS_WITH_WARNINGS
Evidence written: .weave/comprehension/evidence-<timestamp>.json
```

---

## Proposed .NET solution layout

```text
ComprehensionGate.sln
src/
  ComprehensionGate.Cli/
  ComprehensionGate.Core/
  ComprehensionGate.Git/
  ComprehensionGate.Risk/
  ComprehensionGate.Llm/
  ComprehensionGate.Evidence/
tests/
  ComprehensionGate.Core.Tests/
  ComprehensionGate.Risk.Tests/
  ComprehensionGate.Llm.Tests/
  ComprehensionGate.Evidence.Tests/
```

### Suggested responsibilities

- **Cli**: command parsing, terminal prompts, user interaction
- **Core**: domain models and orchestration interfaces
- **Git**: diff retrieval and git metadata access
- **Risk**: local heuristics and sensitive-path detection
- **Llm**: provider integration and prompt handling
- **Evidence**: local evidence file writing and token generation

---

## Minimal domain concepts

Recommended core models:

- `SubmissionIntent`
- `DiffContext`
- `RiskClassification`
- `InterviewQuestion`
- `InterviewAnswer`
- `AnswerAssessment`
- `ComprehensionVerdict`
- `EvidenceRecord`

---

## Evidence model for v1

The pilot should write a local evidence record, for example:

```text
.weave/comprehension/evidence-2026-04-15T12-34-56Z.json
```

Suggested fields:

- schema version
- repository name
- branch
- head SHA
- base branch
- summary of declared intent
- AI usage disclosure
- risk classification
- verdict
- warnings
- whether escalation is required
- token/id
- provider/model metadata
- timestamp

For v1, the evidence can be purely local. Central storage can come later.

---

## Prompting approach

Two prompt families are sufficient for the pilot:

### 1. GenerateInterview

Goal:

- produce diff-aware comprehension questions
- scale depth to risk
- include AI-specific questioning when relevant

### 2. EvaluateInterview

Goal:

- assess whether answers show genuine understanding
- rate each answer
- produce a verdict
- request one follow-up if needed

Important prompt rule:

The LLM must assess **comprehension**, not general code quality.

---

## What to defer until later

Do **not** overbuild the pilot.

Defer these until the workflow is validated:

- ASP.NET Core backend service
- GitHub App integration
- PR-time enforcement
- central evidence store
- dashboards
- reviewer routing UI
- advanced cryptographic attestation
- multi-provider abstraction beyond what is needed

---

## Recommended repository for implementation

Create a dedicated repository for the pilot, for example:

- `comprehension-gate`
- `pre-pr-comprehension-gate`
- `dark-code-comprehension-gate`

This will keep the prototype independent from the current website repository and make it easier to evolve into a standalone tool or platform service later.

---

## Recommended next steps in the new repository

1. create the new repository
2. scaffold the .NET 10 solution
3. define the domain DTOs and evidence format
4. implement git diff collection
5. implement local risk heuristics
6. integrate one LLM provider
7. implement interactive terminal Q&A
8. implement evaluation flow with one optional follow-up
9. write evidence file locally
10. test with real diffs from small/medium/high-risk changes

---

## Success criteria for the pilot

The pilot is successful if it can:

- run locally from the terminal
- inspect a branch diff against a base branch
- collect intent and AI disclosure
- classify risk deterministically
- generate useful comprehension questions
- evaluate answers plausibly
- force escalation for sensitive changes
- write durable local evidence
- produce a clear pass/warn/escalate/block outcome

---

## Final recommendation

Proceed with a **CLI-first .NET 10 / C# 14 pilot in a separate repository**.

Do **not** model the first implementation on the Python PR-comment workflow beyond borrowing the broad idea that comprehension can be operationalized.

The preferred shape is:

- pre-PR
- CLI-driven
- risk-based
- LLM-assisted
- local evidence first
- human escalation for sensitive changes

That gives the fastest path to testing whether a genuine comprehension gate is useful before investing in GitHub-native enforcement or centralized services.
