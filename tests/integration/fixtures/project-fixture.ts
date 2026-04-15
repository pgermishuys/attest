import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const run = (cwd: string, ...args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr)
}

export const createProjectFixture = (options?: { withConfig?: boolean }): string => {
  const repoRoot = mkdtempSync(join(tmpdir(), "attest-fixture-"))
  run(repoRoot, "init", "-b", "main")
  run(repoRoot, "config", "user.email", "attest@example.com")
  run(repoRoot, "config", "user.name", "Attest")
  mkdirSync(join(repoRoot, "src"), { recursive: true })
  writeFileSync(join(repoRoot, "README.md"), "# fixture\n")
  writeFileSync(join(repoRoot, "src", "index.ts"), "export const value = 1\n")
  run(repoRoot, "add", "README.md", "src/index.ts")
  run(repoRoot, "commit", "-m", "init")

  if (options?.withConfig) {
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(
      join(repoRoot, ".attest", "config.json"),
      JSON.stringify({
        baseBranch: "main",
        maxDiffCharacters: 80,
      }),
    )
  }

  return repoRoot
}
