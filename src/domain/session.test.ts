import { describe, expect, it } from "bun:test"
import { createDiffContext } from "./diff-context"
import { createSessionRecord, transitionSessionStatus } from "./session"

describe("session record", () => {
  const diffContext = createDiffContext({
    mode: "working_tree",
    target: "HEAD",
    changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
    truncated: false,
  })

  it("defaults new sessions to collecting context", () => {
    const session = createSessionRecord({
      sessionId: "ses_123",
      createdAt: "2026-04-15T08:00:00.000Z",
      updatedAt: "2026-04-15T08:00:00.000Z",
      diffContext,
      questions: [],
      answers: [],
    })

    expect(session.status).toBe("collecting_context")
  })

  it("supports valid status transitions", () => {
    const initial = createSessionRecord({
      sessionId: "ses_123",
      createdAt: "2026-04-15T08:00:00.000Z",
      updatedAt: "2026-04-15T08:00:00.000Z",
      diffContext,
      questions: [],
      answers: [],
    })

    const next = transitionSessionStatus(initial, "asking_questions", "2026-04-15T08:01:00.000Z")

    expect(next.status).toBe("asking_questions")
    expect(next.updatedAt).toBe("2026-04-15T08:01:00.000Z")
  })

  it("rejects invalid status transitions", () => {
    const initial = createSessionRecord({
      sessionId: "ses_123",
      createdAt: "2026-04-15T08:00:00.000Z",
      updatedAt: "2026-04-15T08:00:00.000Z",
      diffContext,
      questions: [],
      answers: [],
    })

    expect(() => transitionSessionStatus(initial, "completed", "2026-04-15T08:01:00.000Z")).toThrow(
      "Invalid session transition",
    )
  })
})
