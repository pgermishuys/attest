import { describe, expect, it } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../src/flow/run-attest"
import { runResume } from "../../src/flow/run-resume"
import { loadLatestIncompleteSession } from "../../src/session/load-latest"
import { createProjectFixture } from "../testkit/fixtures/project-fixture"

describe("session resume", () => {
  it("resumes the latest incomplete session and preserves prior answers", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "service.ts"), "export const runService = () => true\n")
    Bun.spawnSync(["git", "add", "src/service.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const started = await runAttest({
      repoRoot,
      sessionId: "ses_resume",
      now: "2026-04-15T10:10:00.000Z",
      answers: ["This service path changes the staged behavior clearly."],
      stopAfterQuestions: true,
    })

    expect(started.sessionId).toBe("ses_resume")
    expect(loadLatestIncompleteSession(repoRoot)?.sessionId).toBe("ses_resume")

    const resumed = await runResume({
      repoRoot,
      now: "2026-04-15T10:11:00.000Z",
      answers: [
        "The key assumption is that callers still expect the same service contract.",
        "I would inspect the changed service implementation first.",
      ],
    })

    const artifact = JSON.parse(readFileSync(resumed.evidenceJsonPath, "utf8"))

    expect(resumed.verdict).toBe("PASS")
    expect(artifact.sessionId).toBe("ses_resume")
    expect(artifact.answers).toHaveLength(3)
    expect(artifact.answers[0]?.answer).toContain("staged behavior")
  })
})
