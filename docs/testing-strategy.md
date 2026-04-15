# Testing Strategy

Attest follows a layered testing strategy aligned with Weave conventions.

## Test Layers

### Unit Tests (`src/**/*.test.ts`)

Co-located alongside source files. Test deterministic logic in isolation with no I/O, no fixtures, no external dependencies.

**Coverage**: config loading, domain models, evidence formatting, git utilities, LLM schema validation, policy rules, session operations, path utilities.

```bash
bun run test:unit
```

### Integration Tests (`test/integration/`)

Test multi-module interactions using temporary project fixtures. These tests create real directory structures and exercise flows that span multiple modules.

**Coverage**: full attest flows, resume flows, evidence writing pipelines, config + policy interactions.

```bash
bun run test:integration
```

### E2E Tests (`test/e2e/`)

Test the plugin from the outside — command registration, slash command handling, plugin loading, and structural verification.

**Coverage**: plugin module exports, command registration, slash command dispatch, plugin file structure, OpenCode plugin loading.

```bash
bun run test:e2e
```

### Behavioral Evals (`evals/`)

Non-blocking evaluations that track LLM-dependent behavior over time. These are not hard correctness proofs — they measure question relevance and verdict consistency.

**Coverage**: question relevance for various diff types, verdict consistency across similar inputs.

```bash
bun run evals
```

## Running Tests

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

## Test Utilities

Shared test fixtures and utilities live in `test/testkit/`:

- `test/testkit/fixtures/` — project fixture builders and sample repos
- Fixtures create temporary directories with realistic project structures

## Principles

1. **Deterministic logic gets unit tests** — policy, risk, verdict, evidence formatting
2. **Multi-module flows get integration tests** — using real fixtures, no mocks where avoidable
3. **Plugin surface gets e2e tests** — verify the contract OpenCode sees
4. **LLM behavior gets evals, not assertions** — track quality trends, don't assert on model output
5. **Co-locate unit tests** — `foo.ts` and `foo.test.ts` live side by side in `src/`
