import { describe, expect, it } from "bun:test"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { collectDiffContext } from "../../.opencode/plugins/attest/git/collect-diff-context"
import { loadAttestConfig } from "../../.opencode/plugins/attest/config/load-config"
import { resolveDiffTarget } from "../../.opencode/plugins/attest/git/resolve-diff-target"
import { createProjectFixture } from "./fixtures/project-fixture"

const run = (cwd: string, ...args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr)
}

describe("git/config flow", () => {
  it("loads config, resolves a staged diff, and summarizes the change", () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    writeFileSync(
      join(repoRoot, ".attest", "config.json"),
      JSON.stringify({
        baseBranch: "main",
        maxDiffCharacters: 2_000,
      }),
    )
    writeFileSync(join(repoRoot, "src", "index.ts"), "export const value = 2\n")
    Bun.spawnSync(["git", "add", "src/index.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const config = loadAttestConfig(repoRoot)
    const target = resolveDiffTarget({
      repoRoot,
      baseBranch: config.baseBranch,
      requestedMode: config.defaultDiffMode,
    })
    const context = collectDiffContext({
      repoRoot,
      target,
      maxDiffCharacters: config.maxDiffCharacters,
    })

    expect(target.mode).toBe("staged")
    expect(context.summary.filesChanged).toBe(1)
    expect(context.changedFiles[0]?.path).toBe("src/index.ts")
    expect(context.changedFiles[0]?.status).toBe("modified")
    expect(context.truncated).toBe(false)
  })

  it("truncates oversized branch diffs deterministically", () => {
    const repoRoot = createProjectFixture({ withConfig: true })
    run(repoRoot, "checkout", "-b", "feature/attest")
    writeFileSync(
      join(repoRoot, ".attest", "config.json"),
      JSON.stringify({
        baseBranch: "main",
        maxDiffCharacters: 40,
      }),
    )
    writeFileSync(join(repoRoot, "src", "index.ts"), `export const value = "${"x".repeat(200)}"\n`)
    Bun.spawnSync(["git", "add", "src/index.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "commit", "-m", "expand diff"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const config = loadAttestConfig(repoRoot)
    const target = resolveDiffTarget({
      repoRoot,
      baseBranch: config.baseBranch,
      requestedMode: "branch",
    })
    const context = collectDiffContext({
      repoRoot,
      target,
      maxDiffCharacters: config.maxDiffCharacters,
    })

    expect(target.target).toBe("main...HEAD")
    expect(context.truncated).toBe(true)
    expect(context.diffText).toContain("[... diff truncated by Attest ...]")
  })
})
