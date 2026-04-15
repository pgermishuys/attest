import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { sanitizePathSegment } from "../path/safe-paths"

export const ensureSessionDirectory = (repoRoot: string): string => {
  const directory = join(repoRoot, ".attest", "sessions")
  mkdirSync(directory, { recursive: true })
  return directory
}

export const sanitizeSessionId = (sessionId: string): string => sanitizePathSegment(sessionId, "sessionId")

export const getSessionFilePath = (repoRoot: string, sessionId: string): string => {
  return join(ensureSessionDirectory(repoRoot), `${sanitizeSessionId(sessionId)}.json`)
}
