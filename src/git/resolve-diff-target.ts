import type { DiffMode } from "../domain/diff-context"
import { gitHasOutput } from "./shared"

export type ResolveDiffTargetOptions = {
  repoRoot: string
  requestedMode?: DiffMode
  baseBranch: string
}

export type ResolvedDiffTarget = {
  mode: DiffMode
  target: string
}

export const resolveDiffTarget = ({ repoRoot, requestedMode, baseBranch }: ResolveDiffTargetOptions): ResolvedDiffTarget => {
  if (requestedMode === "branch") {
    return {
      mode: "branch",
      target: `${baseBranch}...HEAD`,
    }
  }

  if (requestedMode === "working_tree") {
    return {
      mode: "working_tree",
      target: "working-tree",
    }
  }

  if (requestedMode === "staged") {
    return {
      mode: "staged",
      target: "staged",
    }
  }

  if (gitHasOutput(repoRoot, ["diff", "--cached", "--name-only"])) {
    return {
      mode: "staged",
      target: "staged",
    }
  }

  if (gitHasOutput(repoRoot, ["diff", "--name-only"])) {
    return {
      mode: "working_tree",
      target: "working-tree",
    }
  }

  return {
    mode: "branch",
    target: `${baseBranch}...HEAD`,
  }
}
