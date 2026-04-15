import { describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import plugin from "../../src/entry-server"
import { runAttest } from "../../src/flow/run-attest"
import { createExecuteBeforeHandler } from "../../src/commands/execute-handler"
import { createSubmitTool } from "../../src/commands/submit-tool"
import { createStubLlmClient } from "../../src/llm/client"
import type { Part } from "@opencode-ai/sdk"

const createMockPluginInput = (repoRoot: string) => ({
  client: {} as import("@opencode-ai/plugin").PluginInput["client"],
  project: { id: "test", path: repoRoot } as import("@opencode-ai/plugin").PluginInput["project"],
  directory: repoRoot,
  worktree: repoRoot,
  experimental_workspace: { register() {} },
  serverUrl: new URL("http://localhost:4321"),
  $: {} as import("@opencode-ai/plugin").PluginInput["$"],
})

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

describe("attest happy path", () => {
  it("server plugin registers commands and exposes tool", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-happy-"))
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(join(repoRoot, ".attest", "config.json"), JSON.stringify({ maxDiffCharacters: 2000 }))

    const hooks = await plugin.server(createMockPluginInput(repoRoot) as never)
    expect(typeof hooks.config).toBe("function")
    expect(typeof hooks["command.execute.before"]).toBe("function")
    expect(hooks.tool?.["attest_submit"]).toBeDefined()
  })

  it("full flow: command handler → session created → tool called → evidence written → verdict returned", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-happy-"))
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(join(repoRoot, ".attest", "config.json"), JSON.stringify({ maxDiffCharacters: 2000 }))
    Bun.spawnSync(["git", "init", "-b", "main"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "config", "user.email", "attest@example.com"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "config", "user.name", "Attest"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    writeFileSync(join(repoRoot, "README.md"), "hello\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    writeFileSync(join(repoRoot, "README.md"), "hello\nworld\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const llmClient = createStubLlmClient()

    // Step 1: Command handler injects interview context
    const handler = createExecuteBeforeHandler(repoRoot, llmClient)
    const output = { parts: [] as Part[] }
    await handler({ command: "attest", sessionID: "ses_happy_path", arguments: "" }, output)

    expect(output.parts).toHaveLength(1)
    const text = output.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
    expect(text).toContain("ses_happy_path")
    expect(text).toContain("Comprehension questions")

    // Extract question IDs from injected context
    const questionMatches = [...text.matchAll(/\[(\w+-\w+|\w+)\]/g)]
    const questionIds = questionMatches.map((m) => m[1]).filter(Boolean)
    expect(questionIds.length).toBeGreaterThan(0)

    // Step 2: Tool called with answers
    const tool = createSubmitTool(repoRoot, llmClient)
    const answers = questionIds.map((id) => ({
      question_id: id!,
      answer: `Detailed answer for ${id} demonstrating solid understanding of the README update.`,
    }))

    const verdict = await tool.execute(
      { session_id: "ses_happy_path", answers },
      createMockToolContext() as never,
    )

    // Step 3: Evidence written and verdict returned
    expect(verdict).toContain("Verdict:")
    expect(verdict).toContain("Evidence written to:")
    expect(existsSync(join(repoRoot, ".attest", "runs"))).toBe(true)
  })

  it("runAttest() core function still works unchanged", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-happy-"))
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(join(repoRoot, ".attest", "config.json"), JSON.stringify({ maxDiffCharacters: 2000 }))
    Bun.spawnSync(["git", "init", "-b", "main"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "config", "user.email", "attest@example.com"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "config", "user.name", "Attest"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    writeFileSync(join(repoRoot, "README.md"), "hello\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    writeFileSync(join(repoRoot, "README.md"), "hello\nworld\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const result = await runAttest({
      repoRoot,
      sessionId: "ses_happy",
      now: "2026-04-15T09:15:00.000Z",
    })

    expect(result.sessionStatus).toBe("completed")
    expect(result.summary).toContain("Attest summary")
    expect(existsSync(result.evidenceJsonPath)).toBe(true)
    expect(existsSync(result.evidenceMarkdownPath)).toBe(true)
  })
})
