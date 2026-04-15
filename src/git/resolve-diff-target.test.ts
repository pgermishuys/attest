import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { resolveDiffTarget } from "./resolve-diff-target"

const run = (cwd: string, ...args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr)
}

const createRepo = (): string => {
  const repoRoot = mkdtempSync(join(tmpdir(), "attest-resolve-"))
  run(repoRoot, "init", "-b", "main")
  run(repoRoot, "config", "user.email", "attest@example.com")
  run(repoRoot, "config", "user.name", "Attest")
  writeFileSync(join(repoRoot, "README.md"), "hello\n")
  run(repoRoot, "add", "README.md")
  run(repoRoot, "commit", "-m", "init")
  mkdirSync(join(repoRoot, "src"), { recursive: true })
  return repoRoot
}

describe("resolveDiffTarget", () => {
  it("prefers staged changes for default mode", () => {
    const repoRoot = createRepo()
    writeFileSync(join(repoRoot, "README.md"), "hello\nstaged\n")
    run(repoRoot, "add", "README.md")

    expect(resolveDiffTarget({ repoRoot, baseBranch: "main" })).toEqual({
      mode: "staged",
      target: "staged",
    })
  })

  it("falls back to working tree changes when nothing is staged", () => {
    const repoRoot = createRepo()
    writeFileSync(join(repoRoot, "README.md"), "hello\nworking tree\n")

    expect(resolveDiffTarget({ repoRoot, baseBranch: "main" })).toEqual({
      mode: "working_tree",
      target: "working-tree",
    })
  })

  it("uses branch diff when requested explicitly", () => {
    const repoRoot = createRepo()
    writeFileSync(join(repoRoot, "README.md"), "hello\nworking tree only\n")

    expect(resolveDiffTarget({ repoRoot, baseBranch: "main", requestedMode: "branch" })).toEqual({
      mode: "branch",
      target: "main...HEAD",
    })
  })
})
