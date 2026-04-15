import { describe, expect, it } from "bun:test"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { createSubmitTool } from "./submit-tool"
import { createStubLlmClient } from "../llm/client"
import { createProjectFixture } from "../../test/testkit/fixtures/project-fixture"

const createMockToolContext = () => ({
  sessionID: "ctx_session",
  messageID: "ctx_message",
  agent: "test-agent",
  directory: "/tmp",
  worktree: "/tmp",
  abort: new AbortController().signal,
  metadata() {},
  ask() {
    return { pipe: () => {} } as never
  },
})

const seedSession = (repoRoot: string, sessionId: string, questionCount = 2) => {
  mkdirSync(join(repoRoot, ".attest", "sessions"), { recursive: true })
  const questions = Array.from({ length: questionCount }, (_, i) => ({
    id: `q${i + 1}`,
    prompt: `Question ${i + 1}?`,
    kind: "how_it_works",
    source: "deterministic",
  }))

  writeFileSync(
    join(repoRoot, ".attest", "sessions", `${sessionId}.json`),
    JSON.stringify({
      sessionId,
      createdAt: "2026-04-15T10:00:00.000Z",
      updatedAt: "2026-04-15T10:00:00.000Z",
      status: "asking_questions",
      diffContext: {
        mode: "staged",
        target: "staged",
        changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
        summary: { filesChanged: 1, additions: 1, deletions: 0 },
        truncated: false,
        diffText: "diff --git a/README.md b/README.md\n+updated\n",
      },
      intent: {
        summary: "Test intent summary",
        motivation: "Test motivation",
        aiDisclosure: { used: false, contributionLevel: "none" },
      },
      risk: {
        level: "low",
        categories: ["docs"],
        requiresHumanEscalation: false,
        rationale: ["Only docs/tests patterns matched."],
      },
      questions,
      answers: [],
    }),
    "utf8",
  )

  return questions
}

describe("createSubmitTool", () => {
  describe("valid session with complete answers", () => {
    it("writes evidence files and returns a verdict string", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_valid"
      const questions = seedSession(repoRoot, sessionId)

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const answers = questions.map((q) => ({
        question_id: q.id,
        answer: `This is a detailed answer to question ${q.id} with enough content to pass.`,
      }))

      const result = await tool.execute({ session_id: sessionId, answers }, createMockToolContext() as never)

      expect(typeof result).toBe("string")
      expect(result).toContain("Verdict:")
      expect(result).toContain("Evidence written to:")
      expect(result).toContain(".json")
      expect(result).toContain(".md")

      // Verify evidence files exist
      const runsDir = join(repoRoot, ".attest", "runs")
      expect(existsSync(runsDir)).toBe(true)
    })

    it("returns PASS when all answers are strong", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_pass"
      const questions = seedSession(repoRoot, sessionId)

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const answers = questions.map((q) => ({
        question_id: q.id,
        // Stub evaluates by answer length >= 24 chars = "strong"
        answer: `Detailed answer with sufficient length for question ${q.id} to qualify as strong.`,
      }))

      const result = await tool.execute({ session_id: sessionId, answers }, createMockToolContext() as never)
      expect(result).toContain("PASS")
    })

    it("marks session as completed after evaluation", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_complete"
      const questions = seedSession(repoRoot, sessionId)

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const answers = questions.map((q) => ({
        question_id: q.id,
        answer: `Answer for ${q.id} with enough detail to pass the length check easily.`,
      }))

      await tool.execute({ session_id: sessionId, answers }, createMockToolContext() as never)

      const { loadSession } = await import("../session/store")
      const session = loadSession(repoRoot, sessionId)
      expect(session.status).toBe("completed")
    })

    it("merges previously stored answers with newly submitted resume answers", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_resume_merge"
      const questions = seedSession(repoRoot, sessionId, 3)
      writeFileSync(
        join(repoRoot, ".attest", "sessions", `${sessionId}.json`),
        JSON.stringify(
          {
            sessionId,
            createdAt: "2026-04-15T10:00:00.000Z",
            updatedAt: "2026-04-15T10:00:00.000Z",
            status: "asking_questions",
            diffContext: {
              mode: "staged",
              target: "staged",
              changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
              summary: { filesChanged: 1, additions: 1, deletions: 0 },
              truncated: false,
              diffText: "diff --git a/README.md b/README.md\n+updated\n",
            },
            intent: {
              summary: "Test intent summary",
              motivation: "Test motivation",
              aiDisclosure: { used: false, contributionLevel: "none" },
            },
            risk: {
              level: "low",
              categories: ["docs"],
              requiresHumanEscalation: false,
              rationale: ["Only docs/tests patterns matched."],
            },
            questions,
            answers: [{ questionId: "q1", answer: "Previously stored answer with enough detail.", answeredAt: "2026-04-15T10:00:30.000Z" }],
          },
          null,
          2,
        ),
        "utf8",
      )

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const result = await tool.execute(
        {
          session_id: sessionId,
          answers: [
            { question_id: "q2", answer: "New resume answer for q2 with enough detail to pass evaluation." },
            { question_id: "q3", answer: "New resume answer for q3 with enough detail to pass evaluation." },
          ],
        },
        createMockToolContext() as never,
      )

      expect(result).toContain("Verdict:")
      const { loadSession } = await import("../session/store")
      const session = loadSession(repoRoot, sessionId)
      expect(session.answers).toHaveLength(3)
      expect(session.answers.find((answer) => answer.questionId === "q1")?.answer).toContain("Previously stored")
      expect(session.status).toBe("completed")
    })

    it("does not allow resumed submissions to overwrite previously stored answers", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_resume_immutable"
      const questions = seedSession(repoRoot, sessionId, 3)
      writeFileSync(
        join(repoRoot, ".attest", "sessions", `${sessionId}.json`),
        JSON.stringify(
          {
            sessionId,
            createdAt: "2026-04-15T10:00:00.000Z",
            updatedAt: "2026-04-15T10:00:00.000Z",
            status: "asking_questions",
            diffContext: {
              mode: "staged",
              target: "staged",
              changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
              summary: { filesChanged: 1, additions: 1, deletions: 0 },
              truncated: false,
              diffText: "diff --git a/README.md b/README.md\n+updated\n",
            },
            intent: {
              summary: "Test intent summary",
              motivation: "Test motivation",
              aiDisclosure: { used: false, contributionLevel: "none" },
            },
            risk: {
              level: "low",
              categories: ["docs"],
              requiresHumanEscalation: false,
              rationale: ["Only docs/tests patterns matched."],
            },
            questions,
            answers: [{ questionId: "q1", answer: "Original stored answer must remain immutable.", answeredAt: "2026-04-15T10:00:30.000Z" }],
          },
          null,
          2,
        ),
        "utf8",
      )

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      await tool.execute(
        {
          session_id: sessionId,
          answers: [
            { question_id: "q1", answer: "Malicious overwrite attempt." },
            { question_id: "q2", answer: "New resume answer for q2 with enough detail to pass evaluation." },
            { question_id: "q3", answer: "New resume answer for q3 with enough detail to pass evaluation." },
          ],
        },
        createMockToolContext() as never,
      )

      const { loadSession } = await import("../session/store")
      const session = loadSession(repoRoot, sessionId)
      expect(session.answers.find((answer) => answer.questionId === "q1")?.answer).toBe(
        "Original stored answer must remain immutable.",
      )
    })
  })

  describe("error cases", () => {
    it("returns error string (not exception) for unknown session ID", async () => {
      const repoRoot = createProjectFixture()
      mkdirSync(join(repoRoot, ".attest", "sessions"), { recursive: true })

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const result = await tool.execute(
        { session_id: "nonexistent_session", answers: [{ question_id: "q1", answer: "answer" }] },
        createMockToolContext() as never,
      )

      expect(typeof result).toBe("string")
      expect(result).toContain("Error:")
      expect(result).toContain("not found")
    })

    it("returns error string (not exception) for incomplete answers", async () => {
      const repoRoot = createProjectFixture()
      const sessionId = "ses_submit_incomplete"
      seedSession(repoRoot, sessionId, 3) // 3 questions

      const tool = createSubmitTool(repoRoot, createStubLlmClient())
      const result = await tool.execute(
        {
          session_id: sessionId,
          answers: [
            { question_id: "q1", answer: "answer one" },
            // Missing q2 and q3
          ],
        },
        createMockToolContext() as never,
      )

      expect(typeof result).toBe("string")
      expect(result).toContain("Error:")
      expect(result).toContain("q2")
      expect(result).toContain("q3")
    })
  })
})
