import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { DiffMode } from "../domain/diff-context"

export type AttestConfig = {
  defaultDiffMode: DiffMode
  baseBranch: string
  maxDiffCharacters: number
  evidenceDirectory: string
  maxQuestionsByRisk: {
    low: number
    medium: number
    high: number
  }
  allowFollowUps: boolean
}

export const defaultAttestConfig: AttestConfig = {
  defaultDiffMode: "staged",
  baseBranch: "main",
  maxDiffCharacters: 12_000,
  evidenceDirectory: ".attest/runs",
  maxQuestionsByRisk: {
    low: 2,
    medium: 4,
    high: 6,
  },
  allowFollowUps: true,
}

const configPath = (repoRoot: string): string => join(repoRoot, ".attest", "config.json")

export const loadAttestConfig = (repoRoot: string): AttestConfig => {
  const filePath = configPath(repoRoot)
  if (!existsSync(filePath)) return defaultAttestConfig

  const raw = JSON.parse(readFileSync(filePath, "utf8")) as Partial<AttestConfig>

  return {
    defaultDiffMode: raw.defaultDiffMode ?? defaultAttestConfig.defaultDiffMode,
    baseBranch: raw.baseBranch ?? defaultAttestConfig.baseBranch,
    maxDiffCharacters: raw.maxDiffCharacters ?? defaultAttestConfig.maxDiffCharacters,
    evidenceDirectory: raw.evidenceDirectory ?? defaultAttestConfig.evidenceDirectory,
    maxQuestionsByRisk: {
      low: raw.maxQuestionsByRisk?.low ?? defaultAttestConfig.maxQuestionsByRisk.low,
      medium: raw.maxQuestionsByRisk?.medium ?? defaultAttestConfig.maxQuestionsByRisk.medium,
      high: raw.maxQuestionsByRisk?.high ?? defaultAttestConfig.maxQuestionsByRisk.high,
    },
    allowFollowUps: raw.allowFollowUps ?? defaultAttestConfig.allowFollowUps,
  }
}
