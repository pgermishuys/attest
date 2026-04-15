# Comprehension Gate Pilot — Executive Summary

> Note (2026-04-15): the original CLI-first pilot recommendation is being superseded by an **OpenCode plugin-first** pilot for faster workflow validation. See [attest-opencode-plugin-pilot.md](./attest-opencode-plugin-pilot.md) for the current direction.

## What we want to build

A **pre-PR comprehension gate** for AI-assisted software development.

Before an engineer opens a pull request, they should be able to demonstrate that they understand the code they are about to submit.

The pilot should be:

- **CLI-first**
- built in **.NET 10 + C# 14**
- **local-first** for v1
- **LLM-assisted** for questioning and answer evaluation
- **risk-based**

---

## Why

AI can generate code faster than engineers fully internalize it.

That creates a governance gap where code can:

- compile
- pass tests
- be submitted for review

without any human being able to clearly explain:

- how it works
- what assumptions it relies on
- what the failure modes are
- how it should be debugged or owned after merge

The goal of the comprehension gate is to verify **human understanding and ownership**, not just code generation or CI success.

---

## What we are not building first

We are **not** starting with:

- a Python implementation
- a PR-comment bot workflow
- a post-PR merge quiz
- a GitHub App
- a centralized web service

We reviewed `commit_comprehension_gate` and decided **not** to use its GitHub Actions + PR comment + multiple-choice Python model as the primary design.

Reason: we want a **true pre-PR workflow**, not a PR-time merge gate.

---

## Recommended pilot flow

1. engineer runs a CLI command such as `dotnet comprehension submit`
2. CLI inspects the git diff against a base branch
3. CLI collects submission intent and AI usage disclosure
4. CLI classifies risk locally
5. CLI calls an LLM to generate comprehension questions
6. engineer answers in the terminal
7. CLI calls the LLM to evaluate the answers
8. CLI writes a local evidence record and returns a verdict

Possible verdicts:

- `PASS`
- `PASS_WITH_WARNINGS`
- `NEEDS_FOLLOWUP`
- `ESCALATE_TO_HUMAN`
- `BLOCK`

---

## Where the LLM fits

The LLM should be used for only two main jobs:

1. **generate interview questions** based on the actual diff and declared intent
2. **evaluate answers** for evidence of genuine understanding

The LLM should **not** be responsible for:

- reading git state
- deterministic risk classification
- mandatory escalation policy
- evidence file creation
- enforcement rules

Those should stay in normal C# code.

---

## Risk model

### Low risk
- docs
- tests
- small refactors

### Medium risk
- business logic changes
- API behavior changes
- multi-file feature work

### High / critical risk
- auth/authz
- tokens / secrets / crypto
- billing / financial logic
- migrations / destructive data changes
- infrastructure / deployment / CI/CD
- privacy / PII-sensitive workflows

Sensitive categories should trigger **mandatory human escalation** in the pilot.

---

## Suggested v1 solution shape

```text
ComprehensionGate.sln
src/
  ComprehensionGate.Cli/
  ComprehensionGate.Core/
  ComprehensionGate.Git/
  ComprehensionGate.Risk/
  ComprehensionGate.Llm/
  ComprehensionGate.Evidence/
```

---

## Success criteria

The pilot is successful if it can:

- run locally from the terminal
- inspect a branch diff
- collect intent and AI disclosure
- classify risk deterministically
- generate useful comprehension questions
- evaluate answers plausibly
- require escalation for sensitive changes
- write a durable local evidence file
- return a clear submission verdict

---

## Recommendation

Build this as a **standalone .NET 10 / C# 14 CLI pilot in a new repository**.

Start simple, validate the workflow, and only later consider:

- ASP.NET Core backend service
- central evidence storage
- GitHub-native enforcement
- org-wide policy integration

For the full handoff and implementation notes, see:

- `.weave/plans/comprehension-gate-pilot-handoff.md`
