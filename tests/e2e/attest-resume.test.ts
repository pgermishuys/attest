import { describe, expect, it } from "bun:test"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { runResume } from "../../.opencode/plugins/attest/flow/run-resume"
import { createProjectFixture } from "../integration/fixtures/project-fixture"

describe("attest resume", () => {
  it("continues from the latest incomplete session", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "service.ts"), "export const runService = () => true\n")
    Bun.spawnSync(["git", "add", "src/service.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    await runAttest({
      repoRoot,
      sessionId: "ses_resume_e2e",
      now: "2026-04-15T10:20:00.000Z",
      answers: ["This changes the service flow with enough detail to count."],
      stopAfterQuestions: true,
    })

    const result = await runResume({
      repoRoot,
      now: "2026-04-15T10:21:00.000Z",
      answers: [
        "The key assumption is that callers still expect a boolean result.",
        "I would inspect the updated service implementation first.",
      ],
    })

    expect(result.verdict).toBe("PASS")
    expect(result.verdictText).toContain("Resumed Attest session ses_resume_e2e")
  })
})
