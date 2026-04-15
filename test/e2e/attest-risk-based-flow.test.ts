import { describe, expect, it } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../src/flow/run-attest"
import { createProjectFixture } from "../testkit/fixtures/project-fixture"

describe("attest risk-based flow", () => {
  it("uses low-risk question depth for docs changes", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "README.md"), "# fixture\n\nupdated\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_low",
      now: "2026-04-15T09:40:00.000Z",
      answers: [
        "This updates the readme to describe the fixture setup clearly.",
        "The main assumption is that docs-only changes remain low risk.",
      ],
    })

    expect(result.questionCount).toBe(2)
    expect(result.summary).toContain("risk: low")
  })

  it("uses high-risk question depth and escalates auth changes", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "auth.ts"), "export const authPolicy = true\n")
    Bun.spawnSync(["git", "add", "src/auth.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_high",
      now: "2026-04-15T09:41:00.000Z",
      answers: [
        "This adds an auth policy export that the authorization layer will read.",
        "The important assumption is that only authenticated callers can activate the path.",
        "I would inspect the auth checks and policy wiring first.",
        "I would review rollback behavior in the auth path.",
        "I would confirm operational monitoring around denied requests.",
      ],
    })

    const artifact = JSON.parse(readFileSync(result.evidenceJsonPath, "utf8"))

    expect(result.questionCount).toBe(5)
    expect(result.verdict).toBe("ESCALATE_TO_HUMAN")
    expect(artifact.risk.level).toBe("high")
  })
})
