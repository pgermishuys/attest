# Attest evals

These evals are **non-blocking behavioral checks** for the LLM-dependent parts of Attest.

They currently cover:

- question relevance and grounding
- verdict consistency for the stub evaluator

Run them with:

```bash
bun run tests/evals/run-evals.ts
```

These evals are trend signals, not deterministic proofs.
