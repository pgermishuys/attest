import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { createProjectFixture } from "./fixtures/project-fixture"

describe("evidence flow", () => {
  it("writes JSON and markdown evidence artifacts for the scaffold flow", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(join(repoRoot, "src", "index.ts"), "export const value = 2\n")
    Bun.spawnSync(["git", "add", "src/index.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_flow",
      now: "2026-04-15T09:10:00.000Z",
      intentInput: {
        summary: "Update the test fixture",
        motivation: "Prove the evidence path works",
        aiUsed: true,
        aiContributionLevel: "medium",
      },
      answers: ["It updates the exported value.", "The fixture assumes staged changes.", "I would inspect the staged diff first."],
    })

    expect(result.verdict).toBe("PASS")
    expect(existsSync(result.evidenceJsonPath)).toBe(true)
    expect(existsSync(result.evidenceMarkdownPath)).toBe(true)
    expect(result.summary).toContain("risk: medium")
    expect(result.verdictText).toContain("Verdict: PASS")

    const jsonArtifact = JSON.parse(readFileSync(result.evidenceJsonPath, "utf8"))
    const markdownArtifact = readFileSync(result.evidenceMarkdownPath, "utf8")

    expect(jsonArtifact.verdict).toBe("PASS")
    expect(markdownArtifact).toContain("# Attest Evidence")
  })
})
