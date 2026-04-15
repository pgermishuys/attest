import { describe, expect, it } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { createProjectFixture } from "../integration/fixtures/project-fixture"

describe("attest escalation", () => {
  it("escalates sensitive token changes even with strong answers", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "token-service.ts"), "export const token = 'secret'\n")
    Bun.spawnSync(["git", "add", "src/token-service.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_escalate",
      now: "2026-04-15T10:40:00.000Z",
      answers: [
        "This adds a token service export that a later auth path would read carefully.",
        "The key assumption is that token handling remains restricted and audited.",
        "I would inspect secret storage and the changed token path first.",
        "I would roll the token path back and rotate if needed.",
        "I would watch token-related audit and failure events after release.",
      ],
    })

    const artifact = JSON.parse(readFileSync(result.evidenceJsonPath, "utf8"))
    expect(result.verdict).toBe("ESCALATE_TO_HUMAN")
    expect(artifact.escalationFlags).toContain("mandatory-human-review")
  })
})
