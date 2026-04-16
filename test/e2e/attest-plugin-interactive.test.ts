import { describe, expect, it } from "bun:test"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import plugin from "../../src/entry"
import { loadSession } from "../../src/session/store"

const createPluginMeta = () => ({
  id: "weave.attest",
  source: "file",
  spec: "./plugins/attest.ts",
  target: "./plugins/attest.ts",
  first_time: Date.now(),
  last_time: Date.now(),
  time_changed: Date.now(),
  load_count: 1,
  fingerprint: "test",
  state: "first",
})

const initializeRepo = (repoRoot: string) => {
  mkdirSync(join(repoRoot, ".attest"), { recursive: true })
  writeFileSync(join(repoRoot, ".attest", "config.json"), JSON.stringify({ maxDiffCharacters: 2000 }))
  Bun.spawnSync(["git", "init", "-b", "main"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
  Bun.spawnSync(["git", "config", "user.email", "attest@example.com"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
  Bun.spawnSync(["git", "config", "user.name", "Attest"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
  writeFileSync(join(repoRoot, "README.md"), "hello\n")
  Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
}

const createPluginApi = (repoRoot: string, prompts: string[], selections: unknown[]) => {
  const toasts: { variant?: string; title?: string; message: string }[] = []
  const registered: unknown[] = []
  const sessions = new Map<string, unknown[]>()
  let sessionCount = 0

  return {
    command: {
      register(cb: () => unknown[]) {
        registered.push(...cb())
        return () => undefined
      },
      trigger() {},
      show() {},
    },
    ui: {
      Dialog: () => null,
      DialogAlert: () => null,
      DialogConfirm: () => null,
      DialogPrompt(input: { onConfirm?: (value: string) => void }) {
        input.onConfirm?.(prompts.shift() ?? "")
        return null
      },
      DialogSelect(input: { onSelect?: (option: { value: unknown }) => void; options: { value: unknown }[] }) {
        const next = selections.shift()
        const option = input.options.find((item) => item.value === next) ?? input.options[0]
        input.onSelect?.(option)
        return null
      },
      Slot: () => null,
      Prompt: () => null,
      toast(input: { variant?: string; title?: string; message: string }) {
        toasts.push(input)
      },
      dialog: {
        replace(render: () => unknown) {
          render()
        },
        clear() {},
        setSize() {},
        size: "medium" as const,
        depth: 0,
        open: false,
      },
    },
    state: {
      path: {
        state: join(repoRoot, ".opencode", "state.json"),
        config: join(repoRoot, ".opencode", "tui.json"),
        worktree: repoRoot,
        directory: repoRoot,
      },
    },
    client: {
      session: {
        async create() {
          sessionCount += 1
          const sessionID = `plugin-session-${sessionCount}`
          sessions.set(sessionID, [])
          return { id: sessionID }
        },
        async promptAsync(input: { sessionID: string; parts?: Array<{ text?: string }>; format?: unknown }) {
          const promptText = input.parts?.map((part) => part.text ?? "").join("\n") ?? ""
          const payload = promptText.includes("Generate reviewer-style interview questions")
            ? {
                questions: [
                  { id: "live-q1", prompt: "How does the change work end to end?", kind: "how_it_works", source: "llm" },
                  { id: "live-q2", prompt: "What assumption matters most here?", kind: "assumptions", source: "llm" },
                  { id: "live-q3", prompt: "What would you inspect first if this failed?", kind: "failure_mode", source: "llm" },
                ],
              }
            : {
                ratings: [
                  { questionId: "live-q1", rating: "strong", rationale: "Grounded answer." },
                  { questionId: "live-q2", rating: "strong", rationale: "Grounded answer." },
                  { questionId: "live-q3", rating: "strong", rationale: "Grounded answer." },
                ],
                recommendedVerdict: "PASS",
                rationale: ["Live OpenCode stub evaluation succeeded."],
              }
          sessions.set(input.sessionID, [{ info: { role: "assistant", structured: payload }, parts: [] }])
          return undefined
        },
        async messages(input: { sessionID: string }) {
          return sessions.get(input.sessionID) ?? []
        },
        async delete(input: { sessionID: string }) {
          sessions.delete(input.sessionID)
          return true
        },
      },
    },
    _registered: registered,
    _toasts: toasts,
  } as {
    _registered: { value: string; onSelect?: () => Promise<void> }[]
    _toasts: { variant?: string; title?: string; message: string }[]
  }
}

describe("attest plugin interactive flow", () => {
  it("collects real intent and answer inputs for /attest", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-plugin-"))
    initializeRepo(repoRoot)
    writeFileSync(join(repoRoot, "README.md"), "hello\nworld\n")
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })

    const api = createPluginApi(
      repoRoot,
      [
        "Summarize the README update",
        "Explain why the README changed",
        "Used AI to draft wording",
        "The README now documents the staged update with enough detail for review.",
        "The main assumption is that readers still rely on README guidance after the change.",
        "I would inspect the staged README diff first if this caused confusion.",
      ],
      [true, "medium"],
    )

    await plugin.tui(api as never, undefined, createPluginMeta() as never)
    const command = api._registered.find((item) => item.value === "attest.run")
    await command?.onSelect?.()

    expect(api._toasts.at(-1)?.message).toContain("wrote 2 questions to evidence")
    const sessionFile = readdirSync(join(repoRoot, ".attest", "sessions")).find((entry) => entry.endsWith(".json"))
    expect(sessionFile).toBeDefined()
    const session = loadSession(repoRoot, sessionFile!.replace(/\.json$/, ""))
    expect(session.intent?.summary).toBe("Summarize the README update")
    expect(session.answers[0]?.answer).toContain("README now documents")
  })

  it("forces branch diff mode for the branch command and resumes with collected answers", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-plugin-"))
    initializeRepo(repoRoot)
    mkdirSync(join(repoRoot, ".attest", "sessions"), { recursive: true })
    writeFileSync(join(repoRoot, "README.md"), "hello\nbranch change\n")
    Bun.spawnSync(["git", "checkout", "-b", "feature/test"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "add", "README.md"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    Bun.spawnSync(["git", "commit", "-m", "branch change"], { cwd: repoRoot, stdout: "ignore", stderr: "pipe" })
    writeFileSync(join(repoRoot, "README.md"), "hello\nbranch change\nworking tree only\n")

    const sessionId = "resume_me"
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
          summary: "Resume summary",
          motivation: "Resume motivation",
          aiDisclosure: { used: false, contributionLevel: "none" },
        },
        risk: {
          level: "medium",
          rationale: ["medium risk fixture"],
          requiresHumanEscalation: false,
          indicators: [],
        },
        questions: [
          { id: "q1", prompt: "How?", kind: "how_it_works", source: "deterministic" },
          { id: "q2", prompt: "Why?", kind: "assumptions", source: "deterministic" },
          { id: "q3", prompt: "Fallback?", kind: "failure_mode", source: "deterministic" },
        ],
        answers: [
          { questionId: "q1", answer: "Existing answer with enough detail to keep state intact.", answeredAt: "2026-04-15T10:10:00.000Z" },
        ],
      }, null, 2),
    )

    const api = createPluginApi(
      repoRoot,
      [
        "Branch summary",
        "Branch motivation",
        "Branch answer one with enough detail to pass on branch mode.",
        "Branch answer two with enough detail to pass on branch mode.",
        "Branch answer three with enough detail to pass on branch mode.",
        "Resume answer two with enough detail to preserve the resumed session.",
        "Resume answer three with enough detail to preserve the resumed session.",
      ],
      [false],
    )

    await plugin.tui(api as never, undefined, createPluginMeta() as never)

    const branchCommand = api._registered.find((item) => item.value === "attest.branch")
    await branchCommand?.onSelect?.()

    const sessionFiles = readdirSync(join(repoRoot, ".attest", "sessions")).map((entry) => join(repoRoot, ".attest", "sessions", entry))
    const branchSessionPath = sessionFiles.find((path) => !path.endsWith(`${sessionId}.json`))
    expect(branchSessionPath).toBeDefined()
    const branchSession = JSON.parse(readFileSync(branchSessionPath!, "utf8")) as { diffContext: { mode: string } }
    expect(branchSession.diffContext.mode).toBe("branch")

    const resumeCommand = api._registered.find((item) => item.value === "attest.resume")
    await resumeCommand?.onSelect?.()

    expect(api._toasts.some((toast) => toast.message.includes("resumed session"))).toBe(true)
    expect(existsSync(join(repoRoot, ".attest", "runs"))).toBe(true)
  })
})
