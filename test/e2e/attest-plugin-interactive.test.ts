import { describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createExecuteBeforeHandler } from "../../src/commands/execute-handler"
import { createSubmitTool } from "../../src/commands/submit-tool"
import { createStubLlmClient } from "../../src/llm/client"
import { createProjectFixture } from "../testkit/fixtures/project-fixture"
import type { Part } from "@opencode-ai/sdk"

const createMockOutput = () => ({ parts: [] as Part[] })

const getPartText = (parts: Part[]): string =>
  parts.map((p) => (p.type === "text" ? p.text : "")).join("\n")

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

const initializeRepo = (repoRoot: string) => {
  writeFileSync(join(repoRoot, "README.md"), "hello\nworld\n")
  Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
}

describe("attest plugin interactive flow (server plugin)", () => {
  it("command.execute.before handler injects interview context for /attest", async () => {
    const repoRoot = createProjectFixture()
    initializeRepo(repoRoot)

    const llmClient = createStubLlmClient()
    const handler = createExecuteBeforeHandler(repoRoot, llmClient)
    const output = createMockOutput()
    await handler({ command: "attest", sessionID: "ses_interactive_1", arguments: "" }, output)

    expect(output.parts).toHaveLength(1)
    const text = getPartText(output.parts)
    expect(text).toContain("attest-interview-context")
    expect(text).toContain("ses_interactive_1")
    expect(text).toContain("Risk level:")
    expect(text).toContain("Comprehension questions")
    expect(text).toContain("attest_submit")

    // Verify session was stored
    const sessionFiles = readdirSync(join(repoRoot, ".attest", "sessions"))
    expect(sessionFiles.length).toBeGreaterThan(0)
  })

  it("attest_submit tool evaluates answers and writes evidence", async () => {
    const repoRoot = createProjectFixture()
    initializeRepo(repoRoot)

    const llmClient = createStubLlmClient()
    const handler = createExecuteBeforeHandler(repoRoot, llmClient)
    const output = createMockOutput()
    await handler({ command: "attest", sessionID: "ses_interactive_2", arguments: "" }, output)

    // Parse question IDs from injected context
    const text = getPartText(output.parts)
    const questionMatches = [...text.matchAll(/\[(\w+-\w+|\w+)\]/g)]
    const questionIds = questionMatches.map((m) => m[1]).filter(Boolean)

    const tool = createSubmitTool(repoRoot, llmClient)
    const answers = questionIds.map((id) => ({
      question_id: id!,
      answer: `This is a detailed answer to question ${id} that demonstrates solid understanding.`,
    }))

    const result = await tool.execute(
      { session_id: "ses_interactive_2", answers },
      createMockToolContext() as never,
    )

    expect(result).toContain("Verdict:")
    expect(result).toContain("Evidence written to:")
    expect(existsSync(join(repoRoot, ".attest", "runs"))).toBe(true)
  })

  it("branch diff mode for attest command with 'branch' argument", async () => {
    const repoRoot = createProjectFixture()
    writeFileSync(join(repoRoot, "src", "feature.ts"), "export const feature = true\n")
    Bun.spawnSync(["git", "checkout", "-b", "feature/interactive-test"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "add", "src/feature.ts"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "commit", "-m", "add feature"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const handler = createExecuteBeforeHandler(repoRoot, createStubLlmClient())
    const output = createMockOutput()
    await handler({ command: "attest", sessionID: "ses_branch_interactive", arguments: "branch" }, output)

    expect(output.parts).toHaveLength(1)
    const text = getPartText(output.parts)
    expect(text).toContain("attest-interview-context")
  })

  it("attest-resume command loads incomplete session and shows remaining questions", async () => {
    const repoRoot = createProjectFixture()
    mkdirSync(join(repoRoot, ".attest", "sessions"), { recursive: true })

    const sessionId = "ses_resume_interactive"
    writeFileSync(
      join(repoRoot, ".attest", "sessions", `${sessionId}.json`),
      JSON.stringify({
        sessionId,
        createdAt: "2026-04-15T10:10:00.000Z",
        updatedAt: "2026-04-15T10:10:00.000Z",
        status: "asking_questions",
        diffContext: {
          mode: "staged",
          target: "staged",
          changedFiles: [{ path: "README.md", status: "modified", additions: 1, deletions: 0 }],
          summary: { filesChanged: 1, additions: 1, deletions: 0 },
          truncated: false,
        },
        intent: {
          summary: "Resume test",
          motivation: "Resume motivation",
          aiDisclosure: { used: false, contributionLevel: "none" },
        },
        risk: {
          level: "medium",
          categories: ["refactor"],
          requiresHumanEscalation: false,
          rationale: ["test"],
        },
        questions: [
          { id: "q1", prompt: "How does it work?", kind: "how_it_works", source: "deterministic" },
          { id: "q2", prompt: "What can fail?", kind: "failure_mode", source: "deterministic" },
          { id: "q3", prompt: "How to roll back?", kind: "rollback", source: "deterministic" },
        ],
        answers: [
          { questionId: "q1", answer: "It works like this.", answeredAt: "2026-04-15T10:10:30.000Z" },
        ],
      }),
      "utf8",
    )

    const handler = createExecuteBeforeHandler(repoRoot, createStubLlmClient())
    const output = createMockOutput()
    await handler({ command: "attest-resume", sessionID: "ses_resume_ctx", arguments: "" }, output)

    expect(output.parts).toHaveLength(1)
    const text = getPartText(output.parts)
    expect(text).toContain("attest-resume-context")
    expect(text).toContain(sessionId)
    expect(text).toContain("q2")
    expect(text).toContain("q3")
    expect(text).toContain("collect only the new answers")
    // q1 was already answered so should not appear
    expect(text).not.toContain("q1]")
  })

  it("resume flow succeeds when only new answers are submitted", async () => {
    const repoRoot = createProjectFixture()
    mkdirSync(join(repoRoot, ".attest", "sessions"), { recursive: true })

    const sessionId = "ses_resume_submit_success"
    writeFileSync(
      join(repoRoot, ".attest", "sessions", `${sessionId}.json`),
      JSON.stringify({
        sessionId,
        createdAt: "2026-04-15T10:10:00.000Z",
        updatedAt: "2026-04-15T10:10:00.000Z",
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
          summary: "Resume test",
          motivation: "Resume motivation",
          aiDisclosure: { used: false, contributionLevel: "none" },
        },
        risk: {
          level: "medium",
          categories: ["refactor"],
          requiresHumanEscalation: false,
          rationale: ["test"],
        },
        questions: [
          { id: "q1", prompt: "How does it work?", kind: "how_it_works", source: "deterministic" },
          { id: "q2", prompt: "What can fail?", kind: "failure_mode", source: "deterministic" },
          { id: "q3", prompt: "How to roll back?", kind: "rollback", source: "deterministic" },
        ],
        answers: [
          { questionId: "q1", answer: "Previously answered q1 with enough detail to keep.", answeredAt: "2026-04-15T10:10:30.000Z" },
        ],
      }),
      "utf8",
    )

    const tool = createSubmitTool(repoRoot, createStubLlmClient())
    const result = await tool.execute(
      {
        session_id: sessionId,
        answers: [
          { question_id: "q2", answer: "Resume answer for q2 with enough detail to demonstrate understanding." },
          { question_id: "q3", answer: "Resume answer for q3 with enough detail to demonstrate understanding." },
        ],
      },
      createMockToolContext() as never,
    )

    expect(result).toContain("Verdict:")
    expect(existsSync(join(repoRoot, ".attest", "runs"))).toBe(true)
  })
})
