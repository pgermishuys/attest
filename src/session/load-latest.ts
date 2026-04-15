import { readdirSync, readFileSync } from "node:fs"
import { ensureSessionDirectory } from "./session-paths"
import type { AttestSessionRecord } from "../domain/session"

export const loadLatestIncompleteSession = (repoRoot: string): AttestSessionRecord | undefined => {
  const directory = ensureSessionDirectory(repoRoot)
  const records = readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => JSON.parse(readFileSync(`${directory}/${entry}`, "utf8")) as AttestSessionRecord)
    .filter((record) => record.status !== "completed" && record.status !== "abandoned")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return records[0]
}
