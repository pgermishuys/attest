import { describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import plugin, { createAttestCommands } from "../../.opencode/plugins/attest/entry"
import { runAttest } from "../../.opencode/plugins/attest/flow/run-attest"
import { AttestRunCommandValue } from "../../.opencode/plugins/attest/types"

const createPluginApi = (repoRoot: string, events: string[]) => {
  const toasts: { title?: string; message: string }[] = []

  return {
    command: {
      register(cb: () => unknown[]) {
        events.push(`register:${cb().length}`)
        return () => undefined
      },
      trigger() {},
      show() {},
    },
    ui: {
      Dialog: () => null,
      DialogAlert: () => null,
      DialogConfirm: () => null,
      DialogPrompt: () => null,
      DialogSelect: () => null,
      Slot: () => null,
      Prompt: () => null,
      toast(input: { title?: string; message: string }) {
        toasts.push(input)
      },
      dialog: {
        replace() {},
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

    _toasts: toasts,
  } as { _toasts: { title?: string; message: string }[] }
}

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

describe("attest happy path", () => {
  it("registers the command and runs the scaffold flow", async () => {
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

    const events: string[] = []
    const api = createPluginApi(repoRoot, events)

    await plugin.tui(api as never, undefined, createPluginMeta() as never)

    const commands = createAttestCommands(() => undefined)
    const runCommand = commands.find((command) => command.value === AttestRunCommandValue)
    expect(runCommand).toBeDefined()
    runCommand?.onSelect?.()

    expect(events[0]).toBe("register:3")
    expect(api._toasts).toHaveLength(0)

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
