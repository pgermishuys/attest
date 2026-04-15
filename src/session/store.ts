import { readFileSync, writeFileSync } from "node:fs"
import type { AttestSessionRecord } from "../domain/session"
import { getSessionFilePath, sanitizeSessionId } from "./session-paths"

export const storeSession = (repoRoot: string, session: AttestSessionRecord): string => {
  const sanitizedSession = {
    ...session,
    sessionId: sanitizeSessionId(session.sessionId),
  }
  const filePath = getSessionFilePath(repoRoot, sanitizedSession.sessionId)
  writeFileSync(filePath, `${JSON.stringify(sanitizedSession, null, 2)}\n`, "utf8")
  return filePath
}

export const loadSession = (repoRoot: string, sessionId: string): AttestSessionRecord => {
  return JSON.parse(readFileSync(getSessionFilePath(repoRoot, sessionId), "utf8")) as AttestSessionRecord
}
