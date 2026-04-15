export const DiffModes = ["staged", "working_tree", "branch"] as const
export type DiffMode = (typeof DiffModes)[number]

export const FileChangeStatuses = ["added", "modified", "deleted", "renamed"] as const
export type FileChangeStatus = (typeof FileChangeStatuses)[number]

export type ChangedFile = {
  path: string
  status: FileChangeStatus
  additions: number
  deletions: number
}

export type DiffSummary = {
  filesChanged: number
  additions: number
  deletions: number
}

export type DiffContext = {
  mode: DiffMode
  target: string
  changedFiles: ChangedFile[]
  summary: DiffSummary
  truncated: boolean
  diffText?: string
}

export const summarizeChangedFiles = (changedFiles: ChangedFile[]): DiffSummary => {
  return changedFiles.reduce<DiffSummary>(
    (summary, file) => ({
      filesChanged: summary.filesChanged + 1,
      additions: summary.additions + file.additions,
      deletions: summary.deletions + file.deletions,
    }),
    {
      filesChanged: 0,
      additions: 0,
      deletions: 0,
    },
  )
}

export const createDiffContext = (input: Omit<DiffContext, "summary"> & { summary?: DiffSummary }): DiffContext => {
  return {
    ...input,
    summary: input.summary ?? summarizeChangedFiles(input.changedFiles),
  }
}
