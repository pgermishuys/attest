import { describe, expect, it } from "bun:test"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { createStubLlmClient } from "../../.opencode/plugins/attest/llm/client"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { createProjectFixture } from "./fixtures/project-fixture"

describe("interview policy flow", () => {
  it("combines deterministic risk policy with LLM-generated interview questions", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "service.ts"), "export const runService = () => true\n")
    Bun.spawnSync(["git", "add", "src/service.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_interview",
      now: "2026-04-15T09:45:00.000Z",
      llmClient: createStubLlmClient(),
      answers: [
        "This service path now returns a success result and is wired into the staged change.",
        "The key assumption is that callers expect a boolean result from the service boundary.",
        "If this failed I would inspect the changed service implementation first.",
      ],
    })

    expect(result.questionCount).toBe(3)
    expect(result.summary).toContain("risk: medium")
    expect(result.verdictText).toContain("Verdict: PASS")
  })
})
