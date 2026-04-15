# Attest OpenCode Plugin Pilot — Execution Plan

## TL;DR
> **Summary**: Build Attest as an OpenCode TUI plugin in small vertical slices: validate command UX quickly, stand up deterministic flow and evidence capture, then layer in risk policy, LLM interviewing, resume/state, and hardening. Keep policy, persistence, and orchestration deterministic; treat question generation and answer evaluation as separately-tested model integrations.
> **Estimated Effort**: Large

## Context
### Original Request
Create an execution-ready implementation plan for the Attest OpenCode plugin pilot in this repository, using the existing direction doc as input and following strong testing discipline inspired by Weave: unit tests for deterministic logic, integration tests with temp fixtures, end-to-end plugin tests, real plugin smoke tests, and non-blocking behavioral evals for LLM-dependent behavior.

### Key Findings
- The active product direction is already documented in `.weave/plans/attest-opencode-plugin-pilot.md` and `README.md`: Attest is an OpenCode-first pilot implemented as a TUI plugin centered on `/attest`.
- The repository currently contains design material only; no implementation scaffold exists yet, so the plan must include initial project/plugin scaffolding.
- OpenCode docs confirm two relevant surfaces: `.opencode/commands/*.md` for fast prompt-based command spikes and `.opencode/plugins/*.{js,ts}` for real plugin behavior. Local plugins load from `.opencode/plugins/`, support TypeScript via `@opencode-ai/plugin`, and can react to `tui.command.execute`, `tui.prompt.append`, shell, tool, and session events.
- The pilot needs resumable state, local evidence writing, and richer control than a markdown command alone, so the command file should be treated as a short-lived spike and the TUI plugin as the real target.

## Objectives
### Core Objective
Ship a testable OpenCode TUI plugin pilot that lets an engineer run `/attest`, answer diff-grounded comprehension questions, receive a verdict, and produce a local evidence artifact that distinguishes deterministic policy from LLM judgment.

### Deliverables
- [ ] OpenCode plugin scaffold with `/attest` flow and project-local config/dependency wiring
- [ ] Deterministic core modules for diff inspection, risk policy, session state, verdict policy, and evidence generation
- [ ] LLM integration boundary for question generation and answer evaluation, covered by contract tests and non-blocking behavioral evals
- [ ] Layered test suite: unit, fixture-based integration, fake-host E2E, and real plugin smoke coverage
- [ ] Pilot documentation for setup, execution, evals, and `/start-work` handoff

### Definition of Done
- [ ] `bun test` passes for unit, integration, and fake-host E2E suites
- [ ] A real OpenCode smoke run verifies the plugin loads and `/attest` is available in a local project fixture
- [ ] Behavioral evals run separately and do not block merges, but emit readable results for question quality and verdict consistency
- [ ] Running `/attest` on a sample repo produces local evidence artifacts under `.attest/runs/`

### Guardrails (Must NOT)
- [ ] Do not turn the spike command into the final implementation surface
- [ ] Do not let the LLM own git inspection, risk classification, session state, verdict thresholds, or evidence persistence
- [ ] Do not require a backend service, PR bot, GitHub App, or CI enforcement in this pilot
- [ ] Do not rely only on prompt/manual testing; each slice must include automated coverage

## TODOs

- [x] 1. Validate OpenCode plugin mechanics with a throwaway slash-command spike
  **What**: Create a minimal `.opencode/commands/attest.md` spike to validate prompt tone, argument shape, and expected `/attest` interaction before committing to the plugin flow. Capture findings in a short design note so the spike can be deleted or frozen once the plugin path is working.
  **Files**: `.opencode/commands/attest.md`, `.weave/plans/attest-opencode-plugin-pilot.md`, `README.md`
  **Acceptance**: `/attest` can be invoked through the markdown command in a local OpenCode session, and the team has a short list of confirmed UX assumptions to carry into the plugin implementation.

- [x] 2. Scaffold the plugin workspace and test harness
  **What**: Add the project-local OpenCode plugin skeleton, package/dependency manifests, TypeScript config, and a test runner layout that cleanly separates unit, integration, E2E, smoke, and eval suites from day one.
  **Files**: `.opencode/package.json`, `.opencode/tsconfig.json`, `.opencode/plugins/attest.ts`, `.opencode/plugins/attest/entry.ts`, `.opencode/plugins/attest/types.ts`, `package.json`, `tsconfig.json`, `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/smoke/`, `tests/evals/`
  **Acceptance**: The repository can install dependencies, typecheck the plugin entrypoint, and run an empty-but-wired test suite with dedicated folders for each test layer.

- [x] 3. Implement deterministic domain contracts first
  **What**: Define the domain models and interfaces before orchestration: diff context, declared intent, AI disclosure, risk classification, interview question/answer contracts, verdicts, session records, and evidence artifacts. Keep LLM-facing DTOs and deterministic policy DTOs separate.
  **Files**: `.opencode/plugins/attest/types.ts`, `.opencode/plugins/attest/domain/diff-context.ts`, `.opencode/plugins/attest/domain/risk.ts`, `.opencode/plugins/attest/domain/session.ts`, `.opencode/plugins/attest/domain/verdict.ts`, `.opencode/plugins/attest/domain/evidence.ts`, `tests/unit/domain/*.test.ts`
  **Acceptance**: Deterministic models are stable enough for downstream slices, and unit tests pin serialization, enum/state transitions, and verdict/risk invariants.

- [x] 4. Build diff collection and local config loading as a deterministic vertical slice
  **What**: Implement repo-local config loading and diff target resolution for default and branch modes, including normalized changed-file summaries and truncation rules for large diffs. This slice should work without any LLM calls.
  **Files**: `.attest/config.example.json`, `.opencode/plugins/attest/config/load-config.ts`, `.opencode/plugins/attest/git/resolve-diff-target.ts`, `.opencode/plugins/attest/git/collect-diff-context.ts`, `.opencode/plugins/attest/git/truncate-diff.ts`, `tests/unit/config/*.test.ts`, `tests/unit/git/*.test.ts`, `tests/integration/fixtures/repos/*`, `tests/integration/git-config-flow.test.ts`
  **Acceptance**: Given temp fixture repos, the system correctly loads config, resolves the target diff, summarizes changed files, and handles oversized diffs deterministically.

- [x] 5. Deliver the smallest viable plugin flow with deterministic evidence output
  **What**: Wire the TUI plugin to register `/attest`, collect intent and AI usage disclosure, run diff inspection, ask a temporary fixed question set, produce a provisional verdict using deterministic stub logic, and write a local JSON/Markdown evidence artifact. This proves the plugin lifecycle before real LLM work lands.
  **Files**: `.opencode/plugins/attest.ts`, `.opencode/plugins/attest/entry.ts`, `.opencode/plugins/attest/flow/run-attest.ts`, `.opencode/plugins/attest/flow/collect-intent.ts`, `.opencode/plugins/attest/evidence/write-json.ts`, `.opencode/plugins/attest/evidence/write-markdown.ts`, `.opencode/plugins/attest/evidence/pathing.ts`, `tests/unit/evidence/*.test.ts`, `tests/integration/evidence-flow.test.ts`, `tests/e2e/attest-happy-path.test.ts`
  **Acceptance**: A fake-host E2E test proves `/attest` can complete a happy-path run and emit local evidence under `.attest/runs/` without model dependencies.

- [x] 6. Add deterministic risk policy and verdict policy
  **What**: Introduce file/path/category heuristics, interview depth selection, mandatory escalation rules, and verdict thresholding. Keep this logic purely deterministic and independently testable, with explicit handling for sensitive categories.
  **Files**: `.opencode/plugins/attest/policy/classify-risk.ts`, `.opencode/plugins/attest/policy/select-interview-depth.ts`, `.opencode/plugins/attest/policy/apply-escalation-rules.ts`, `.opencode/plugins/attest/policy/compute-verdict.ts`, `tests/unit/policy/*.test.ts`, `tests/integration/risk-evidence-policy.test.ts`
  **Acceptance**: Unit tests cover low/medium/high-risk mapping, escalation triggers, and verdict threshold rules; integration tests prove policy decisions are reflected in the written artifact.

- [x] 7. Introduce the LLM interviewer behind a strict contract boundary
  **What**: Add a narrow LLM adapter for question generation and answer evaluation only. Define prompt templates, schema-validated responses, fallback behavior for malformed outputs, and deterministic test doubles so the rest of the flow stays testable without a live model.
  **Files**: `.opencode/plugins/attest/llm/client.ts`, `.opencode/plugins/attest/llm/generate-questions.ts`, `.opencode/plugins/attest/llm/evaluate-answers.ts`, `.opencode/plugins/attest/llm/prompts/generate-interview.md`, `.opencode/plugins/attest/llm/prompts/evaluate-interview.md`, `.opencode/plugins/attest/llm/schema.ts`, `tests/unit/llm/*.test.ts`, `tests/integration/llm-contract-flow.test.ts`
  **Acceptance**: Deterministic tests validate request/response contracts and malformed-output handling, and the plugin can swap between stub and live LLM implementations without changing the orchestration layer.

- [x] 8. Upgrade the plugin flow to risk-based questioning
  **What**: Replace the temporary fixed questions with risk-adjusted, diff-grounded interview generation and answer evaluation. Ensure the plugin can show a concise preflight summary, ask the right number of questions by risk, and surface rationale without exposing raw model internals.
  **Files**: `.opencode/plugins/attest/flow/run-attest.ts`, `.opencode/plugins/attest/flow/build-interview-plan.ts`, `.opencode/plugins/attest/ui/render-summary.ts`, `.opencode/plugins/attest/ui/render-verdict.ts`, `tests/e2e/attest-risk-based-flow.test.ts`, `tests/integration/interview-policy-flow.test.ts`
  **Acceptance**: Fake-host E2E tests cover low-risk and high-risk runs, and the resulting verdict/evidence reflects both deterministic policy inputs and LLM-generated interview outputs.

- [x] 9. Add resumable sessions and interrupted-run recovery
  **What**: Persist in-progress state so `/attest resume` can restore the latest incomplete interview, preserve evidence lineage, and continue from the correct step. Define expiration/cleanup behavior for abandoned sessions.
  **Files**: `.opencode/plugins/attest/session/store.ts`, `.opencode/plugins/attest/session/load-latest.ts`, `.opencode/plugins/attest/session/resume-run.ts`, `.opencode/plugins/attest/session/session-paths.ts`, `.opencode/plugins/attest/flow/run-resume.ts`, `tests/unit/session/*.test.ts`, `tests/integration/session-resume.test.ts`, `tests/e2e/attest-resume.test.ts`
  **Acceptance**: An interrupted fake-host run can be resumed, unanswered questions remain pending, prior answers are preserved, and the final evidence artifact links back to the original session.

- [x] 10. Harden with real plugin smoke coverage and fixture-based end-to-end scenarios
  **What**: Add a real OpenCode smoke harness that boots OpenCode with the local plugin and verifies load/command registration, plus richer end-to-end scenarios for escalation, malformed model output, and large-diff handling.
  **Files**: `tests/smoke/opencode-plugin-load.test.ts`, `tests/smoke/fixtures/*`, `tests/e2e/attest-escalation.test.ts`, `tests/e2e/attest-large-diff.test.ts`, `tests/e2e/attest-llm-fallback.test.ts`
  **Acceptance**: At least one real OpenCode smoke run confirms the plugin is discoverable, and E2E scenarios cover the primary failure modes likely to break the pilot in real use.

- [x] 11. Add non-blocking behavioral evals for LLM-dependent quality
  **What**: Create eval datasets and scoring scripts that exercise question relevance, grounding to the diff, answer-evaluation consistency, and escalation reasonableness. Keep these out of the blocking CI path, but make results easy to inspect over time.
  **Files**: `tests/evals/cases/*.json`, `tests/evals/run-evals.ts`, `tests/evals/reporting.ts`, `tests/evals/README.md`
  **Acceptance**: Behavioral evals can be run on demand, emit stable reports, and clearly separate model-quality signals from deterministic pass/fail tests.

- [x] 12. Document pilot operation, test commands, and rollout expectations
  **Status note**: The repo should document the current OpenCode plugin scaffold, test commands, evidence/session paths, deterministic vs LLM boundaries, and that continued execution happens through `/start-work` against this plan file.
  **What**: Update repo docs so a contributor can install the plugin locally, run each test layer, understand where deterministic vs LLM behavior lives, and execute the pilot against a sample repo. End with the execution handoff note.
  **Files**: `README.md`, `.weave/plans/attest-opencode-plugin-pilot.md`, `.weave/plans/attest-opencode-plugin-pilot-execution-plan.md`
  **Acceptance**: A new contributor can follow the docs to run the plugin, execute the layered tests, and understand which checks are blocking versus advisory.

## Verification
- [x] All tests pass
- [x] No regressions
- [x] `bun test` covers unit, integration, and fake-host E2E suites
- [x] Real OpenCode smoke test verifies plugin load and `/attest` availability
- [x] Behavioral evals run separately and produce readable reports without blocking delivery
- [x] Sample runs write `.attest/runs/<timestamp>.json` and `.attest/runs/<timestamp>.md`
- [x] Execution should proceed via `/start-work`
