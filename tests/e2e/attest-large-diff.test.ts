import { describe, expect, it } from "bun:test"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { createProjectFixture } from "../integration/fixtures/project-fixture"

describe("attest large diff", () => {
  it("handles oversized diffs without failing the flow", async () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(join(repoRoot, ".attest", "config.json"), JSON.stringify({ baseBranch: "main", maxDiffCharacters: 60 }))
    writeFileSync(join(repoRoot, "src", "large.ts"), `export const large = "${"x".repeat(400)}"\n`)
    Bun.spawnSync(["git", "add", "src/large.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_large",
      now: "2026-04-15T10:41:00.000Z",
      answers: [
        "This adds a large constant so we can verify truncation handling in the diff collector.",
        "The key assumption is that truncation preserves enough context for questioning.",
        "I would inspect the truncated diff marker and affected file first.",
      ],
    })

    expect(result.summary).toContain("Attest summary")
    expect(result.verdict).toBe("PASS")
  })
})
