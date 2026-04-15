import { describe, expect, it } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../src/flow/run-attest"
import { createProjectFixture } from "../testkit/fixtures/project-fixture"

describe("risk policy evidence flow", () => {
  it("reflects deterministic escalation decisions in the evidence artifact", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "auth-policy.ts"), "export const policy = true\n")
    Bun.spawnSync(["git", "add", "src/auth-policy.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_policy",
      now: "2026-04-15T09:20:00.000Z",
      answers: [
        "This file adds an auth policy flag that will be read by the authorization layer.",
        "The key assumption is that only authenticated callers can toggle the policy path.",
        "I would inspect the auth checks and the staged diff first.",
      ],
    })

    const artifact = JSON.parse(readFileSync(result.evidenceJsonPath, "utf8"))

    expect(result.verdict).toBe("ESCALATE_TO_HUMAN")
    expect(result.summary).toContain("risk: high")
    expect(artifact.risk.level).toBe("high")
    expect(artifact.escalationFlags).toContain("mandatory-human-review")
  })
})
