import { describe, expect, it } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDiffContext } from "../domain/diff-context"
import { createSessionRecord } from "../domain/session"
import { loadLatestIncompleteSession } from "./load-latest"
import { storeSession } from "./store"

describe("loadLatestIncompleteSession", () => {
  it("returns the most recent incomplete session", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-load-latest-"))
    const diffContext = createDiffContext({
      mode: "staged",
      target: "staged",
      changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
      truncated: false,
    })

    storeSession(
      repoRoot,
      createSessionRecord({
        sessionId: "ses_old",
        createdAt: "2026-04-15T10:00:00.000Z",
        updatedAt: "2026-04-15T10:00:00.000Z",
        diffContext,
        questions: [],
        answers: [],
      }),
    )
    storeSession(
      repoRoot,
      createSessionRecord({
        sessionId: "ses_new",
        createdAt: "2026-04-15T10:01:00.000Z",
        updatedAt: "2026-04-15T10:01:00.000Z",
        diffContext,
        questions: [],
        answers: [],
      }),
    )

    expect(loadLatestIncompleteSession(repoRoot)?.sessionId).toBe("ses_new")
  })
})
