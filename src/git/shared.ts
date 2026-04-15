import { spawnSync } from "node:child_process"

export const runGit = (repoRoot: string, args: string[]): string => {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`)
  }

  return result.stdout.trim()
}

export const gitHasOutput = (repoRoot: string, args: string[]): boolean => {
  return runGit(repoRoot, args).trim().length > 0
}
