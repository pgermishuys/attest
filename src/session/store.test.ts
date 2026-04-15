import { describe, expect, it } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDiffContext } from "../domain/diff-context"
import { createSessionRecord } from "../domain/session"
import { loadSession, storeSession } from "./store"

describe("session store", () => {
  it("writes and reloads a session record", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-session-store-"))
    const session = createSessionRecord({
      sessionId: "ses_store",
      createdAt: "2026-04-15T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
      diffContext: createDiffContext({
        mode: "staged",
        target: "staged",
        changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
        truncated: false,
      }),
      questions: [],
      answers: [],
    })

    storeSession(repoRoot, session)

    expect(loadSession(repoRoot, "ses_store")).toEqual(session)
  })

  it("stores sessions under a sanitized session id", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-session-store-"))
    const session = createSessionRecord({
      sessionId: "../../escaped session",
      createdAt: "2026-04-15T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
      diffContext: createDiffContext({
        mode: "staged",
        target: "staged",
        changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
        truncated: false,
      }),
      questions: [],
      answers: [],
    })

    storeSession(repoRoot, session)

    expect(loadSession(repoRoot, "escaped_session").sessionId).toBe("escaped_session")
  })
})
