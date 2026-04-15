import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { resolvePathInsideRoot } from "../path/safe-paths"

const safeTimestamp = (timestamp: string): string => timestamp.replaceAll(":", "-")

export const ensureEvidenceDirectory = (repoRoot: string, relativeDirectory: string): string => {
  const evidenceDirectory = resolvePathInsideRoot(repoRoot, relativeDirectory, "evidenceDirectory")
  mkdirSync(evidenceDirectory, { recursive: true })
  return evidenceDirectory
}

export const createEvidenceFilePaths = (repoRoot: string, relativeDirectory: string, timestamp: string) => {
  const evidenceDirectory = ensureEvidenceDirectory(repoRoot, relativeDirectory)
  const baseName = safeTimestamp(timestamp)

  return {
    directory: evidenceDirectory,
    json: join(evidenceDirectory, `${baseName}.json`),
    markdown: join(evidenceDirectory, `${baseName}.md`),
  }
}
