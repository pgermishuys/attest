import { describe, expect, it } from "bun:test"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import type { AttestLlmClient } from "../../.opencode/plugins/attest/llm/client"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { createProjectFixture } from "../integration/fixtures/project-fixture"

const malformedClient: AttestLlmClient = {
  async generateQuestions() {
    throw new Error("Malformed LLM question payload")
  },
  async evaluateAnswers() {
    throw new Error("Malformed LLM answer payload")
  },
}

describe("attest llm fallback", () => {
  it("falls back to deterministic questions and evaluation when LLM output is malformed", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "service.ts"), "export const runService = () => true\n")
    Bun.spawnSync(["git", "add", "src/service.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_bad_llm",
      now: "2026-04-15T10:42:00.000Z",
      llmClient: malformedClient,
      answers: [
        "This answer is intentionally long enough to stay on the safe deterministic fallback path.",
        "The key assumption is that the staged service contract remains compatible with current callers.",
        "I would inspect the changed service implementation and staged diff first if this regressed.",
      ],
    })

    expect(result.verdict).toBe("PASS")
    expect(result.verdictText).toContain("LLM evaluation fallback used deterministic scoring")
  })
})
