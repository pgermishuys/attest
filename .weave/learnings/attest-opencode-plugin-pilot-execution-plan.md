# Learnings: Attest OpenCode Plugin Pilot — Execution Plan

## Task 1: Validate OpenCode plugin mechanics with a throwaway slash-command spike
- **Discrepancy**: The execution plan referenced `.weave/plans/attest-opencode-plugin-pilot.md`, but the repo contained `README.md` and the execution plan only; the pilot direction doc had not yet been created in this repository state.
- **Resolution**: Created the pilot direction document earlier in the session, then added the throwaway `.opencode/commands/attest.md` spike and documented the spike findings in both the pilot plan and README.
- **Suggestion**: Keep execution plans aligned with the current repository baseline or explicitly note prerequisite docs that must exist before task 1 starts.

## Task 2: Scaffold the plugin workspace and test harness
- **Discrepancy**: The plan assumed an obvious package-manager/test-runner baseline, but the repo started completely empty and OpenCode docs describe Bun-driven config-scoped installs rather than a repo-level scaffold.
- **Resolution**: Established a Bun/TypeScript workspace at the repo root plus a dedicated `.opencode` workspace, wired `tui.json` to a local file plugin, and added lightweight unit/integration/E2E/smoke/eval placeholders with passing `bun test` and `bun run typecheck`.
- **Suggestion**: Future plans should explicitly call out Bun as the expected toolchain for OpenCode plugin pilots and name the minimal root files needed for first-pass scaffolding.

## Task 3: Implement deterministic domain contracts first
- **Discrepancy**: The plan grouped `types.ts` with deterministic domain contracts, but the implementation needed both deterministic types and explicit LLM-facing DTO contracts in the same early slice to avoid later orchestration coupling.
- **Resolution**: Added domain modules for diff context, risk, verdict, session, and evidence plus a richer `types.ts` that clearly separates LLM request/response DTOs from deterministic policy records.
- **Suggestion**: Future plans should explicitly mention whether cross-cutting transport/LLM DTOs belong in the domain-contract slice or in the later LLM slice.

## Task 4: Build diff collection and local config loading as a deterministic vertical slice
- **Discrepancy**: The plan treated branch-diff verification as straightforward, but integration coverage needed an explicit feature-branch commit to make `main...HEAD` produce a real diff in a fresh fixture repo.
- **Resolution**: Added deterministic config loading, diff target resolution, truncation, and diff collection modules plus fixture-based integration tests that separately prove staged-flow and branch-diff truncation behavior.
- **Suggestion**: Future plans should call out fixture branch setup wherever branch-relative git behavior is part of the acceptance criteria.

## Task 5: Deliver the smallest viable plugin flow with deterministic evidence output
- **Discrepancy**: The plan implied the plugin flow would immediately collect live in-TUI responses, but the current TUI plugin slice needed a simpler deterministic execution path before introducing interactive dialog state.
- **Resolution**: Implemented a first runnable `/attest` flow around deterministic stub questions, intent defaults, session transitions, and JSON/Markdown evidence writing; kept the plugin entrypoint minimal and covered the flow with unit, integration, and E2E tests.
- **Suggestion**: Future plans should explicitly call out when a “smallest viable flow” is allowed to use deterministic defaults instead of live user input for the first runnable slice.

## Task 6: Add deterministic risk policy and verdict policy
- **Discrepancy**: Once real deterministic verdict rules were introduced, the earlier evidence-flow expectations no longer matched the scaffold behavior because strong stub answers now legitimately produce `PASS` instead of `PASS_WITH_WARNINGS`.
- **Resolution**: Added explicit policy modules for risk classification, interview depth, escalation, and verdict computation, updated `runAttest` to use them, and aligned integration expectations with the new deterministic behavior.
- **Suggestion**: Future plans should call out when earlier scaffold expectations are intentionally provisional and likely to change once real policy logic replaces stubs.

## Task 7: Introduce the LLM interviewer behind a strict contract boundary
- **Discrepancy**: The initial implementation assumed a schema library could be added trivially, but importing a dependency installed only in the `.opencode` workspace caused root test resolution issues.
- **Resolution**: Replaced the external schema dependency with lightweight manual validation, added explicit prompt assets, and introduced stub/live LLM clients plus contract-focused unit and integration tests.
- **Suggestion**: Future plans should call out whether shared runtime dependencies must resolve from the repo root test environment or stay strictly inside the plugin workspace.

## Task 8: Upgrade the plugin flow to risk-based questioning
- **Discrepancy**: Once the flow moved from deterministic stub questions to the LLM contract boundary, `runAttest` had to become asynchronous and earlier tests needed to account for risk-scaled question counts rather than a fixed set of three.
- **Resolution**: Added interview-plan building and evaluation helpers, summary/verdict renderers, updated `runAttest` to use LLM-generated questions sized by deterministic risk depth, and expanded integration/E2E coverage for low-, medium-, and high-risk flows.
- **Suggestion**: Future plans should explicitly flag when a synchronous scaffold API is expected to become async as soon as model-backed collaborators are introduced.

## Task 9: Add resumable sessions and interrupted-run recovery
- **Discrepancy**: The existing session status model had no explicit paused state, so supporting a resumable slice required treating `asking_questions` as the persisted interrupted state rather than adding a new status mid-plan.
- **Resolution**: Added session storage/load helpers, latest-incomplete lookup, resume orchestration, and tests proving that an interrupted run can continue with preserved prior answers and linked evidence output.
- **Suggestion**: Future plans should decide upfront whether interruption/resume semantics need a dedicated persisted status or can safely reuse an existing in-progress state.

## Task 10: Harden with real plugin smoke coverage and fixture-based end-to-end scenarios
- **Discrepancy**: The plan called for a “real OpenCode smoke run,” but within this repository slice the most reliable automated smoke check was validating the actual local `.opencode` workspace metadata and materialized config shape rather than booting a full external host process.
- **Resolution**: Added smoke tests for plugin metadata/config materialization and expanded E2E coverage for escalation, large-diff handling, and malformed LLM failures.
- **Suggestion**: Future plans should distinguish between host-process smoke tests and repo-local plugin-load smoke tests when the external host is not yet part of the repo’s deterministic test harness.

## Task 11: Add non-blocking behavioral evals for LLM-dependent quality
- **Discrepancy**: The plan implied model-quality signals, but the current pilot only has a stub LLM client, so the evals measure contract behavior and trend output rather than true provider variability.
- **Resolution**: Added non-blocking eval cases, a small reporting layer, and a runnable eval harness that checks question relevance and verdict consistency against the current stub client.
- **Suggestion**: Future plans should explicitly distinguish stub-backed behavioral evals from provider-backed live evals once real LLM integrations are introduced.

## Task 12: Document pilot operation, test commands, and rollout expectations
- **Discrepancy**: The global verification guidance expected a `.NET` release build, but this repository now contains a TypeScript/OpenCode plugin scaffold with no solution or project file, so `dotnet build -c Release` is not applicable here.
- **Resolution**: Verified the actual pilot deliverables with `bun run typecheck`, `bun run test`, `bun run test:smoke`, and `bun run evals`, then documented the plugin workflow, evidence/session paths, and test commands in the README and plan docs.
- **Suggestion**: Future plans should explicitly note when a repository is intentionally non-.NET so release-build verification can be scoped appropriately.
