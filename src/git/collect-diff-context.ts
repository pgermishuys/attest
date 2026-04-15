import { createDiffContext, type ChangedFile, type DiffContext } from "../domain/diff-context"
import type { ResolvedDiffTarget } from "./resolve-diff-target"
import { runGit } from "./shared"
import { truncateDiff } from "./truncate-diff"

const diffArgs = (target: ResolvedDiffTarget, extra: string[] = []): string[] => {
  if (target.mode === "staged") return ["diff", "--cached", ...extra]
  if (target.mode === "working_tree") return ["diff", ...extra]
  return ["diff", target.target, ...extra]
}

const parseStatus = (code: string): ChangedFile["status"] => {
  if (code.startsWith("A")) return "added"
  if (code.startsWith("D")) return "deleted"
  if (code.startsWith("R")) return "renamed"
  return "modified"
}

const parseNameStatus = (output: string): Map<string, ChangedFile["status"]> => {
  const entries = new Map<string, ChangedFile["status"]>()
  if (!output.trim()) return entries

  for (const line of output.split("\n")) {
    if (!line.trim()) continue
    const parts = line.split("\t")
    const statusCode = parts[0] ?? "M"
    const path = statusCode.startsWith("R") ? parts[2] : parts[1]
    if (!path) continue
    entries.set(path, parseStatus(statusCode))
  }

  return entries
}

const parseNumstat = (output: string, statuses: Map<string, ChangedFile["status"]>): ChangedFile[] => {
  if (!output.trim()) return []

  return output
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.split("\t")
      const additions = Number.parseInt(parts[0] ?? "0", 10)
      const deletions = Number.parseInt(parts[1] ?? "0", 10)
      const path = parts.length >= 4 ? (parts[3] as string) : (parts[2] as string)

      return {
        path,
        status: statuses.get(path) ?? "modified",
        additions: Number.isNaN(additions) ? 0 : additions,
        deletions: Number.isNaN(deletions) ? 0 : deletions,
      }
    })
}

export type CollectDiffContextOptions = {
  repoRoot: string
  target: ResolvedDiffTarget
  maxDiffCharacters: number
}

export const collectDiffContext = ({ repoRoot, target, maxDiffCharacters }: CollectDiffContextOptions): DiffContext => {
  const nameStatus = runGit(repoRoot, diffArgs(target, ["--name-status", "--find-renames"]))
  const numstat = runGit(repoRoot, diffArgs(target, ["--numstat", "--find-renames"]))
  const diffText = runGit(repoRoot, diffArgs(target, ["--no-ext-diff", "--minimal"]))

  const statuses = parseNameStatus(nameStatus)
  const changedFiles = parseNumstat(numstat, statuses)
  const truncated = truncateDiff(diffText, maxDiffCharacters)

  return createDiffContext({
    mode: target.mode,
    target: target.target,
    changedFiles,
    truncated: truncated.truncated,
    diffText: truncated.text,
  })
}
