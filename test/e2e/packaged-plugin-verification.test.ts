/**
 * Packaged-plugin verification test
 *
 * This test dynamically imports the BUILT dist/index.js artifact (not the source)
 * to catch issues that unit tests would miss:
 * - Missing prompt assets at runtime
 * - Broken import.meta.dir references
 * - Missing externals or broken module shape
 * - Command registration against the built artifact
 *
 * PREREQUISITE: Run `bun run build` before running this test.
 * This test is included in `bun test test/e2e/` and will fail if dist/index.js
 * has not been built.
 */

import { describe, expect, it, beforeAll } from "bun:test"
import { existsSync } from "node:fs"
import { join } from "node:path"
import type { PluginModule } from "@opencode-ai/plugin"
import type { Config } from "@opencode-ai/plugin"

const DIST_PATH = join(import.meta.dir, "..", "..", "dist", "index.js")

const createMockPluginInput = () => ({
  client: {} as import("@opencode-ai/plugin").PluginInput["client"],
  project: { id: "test", path: "/tmp" } as import("@opencode-ai/plugin").PluginInput["project"],
  directory: "/tmp",
  worktree: "/tmp",
  experimental_workspace: { register() {} },
  serverUrl: new URL("http://localhost:4321"),
  $: {} as import("@opencode-ai/plugin").PluginInput["$"],
})

describe("packaged-plugin verification (dist/index.js)", () => {
  beforeAll(() => {
    if (!existsSync(DIST_PATH)) {
      throw new Error(
        `dist/index.js not found at ${DIST_PATH}. Run 'bun run build' before running this test.`,
      )
    }
  })

  it("dist/index.js exists", () => {
    expect(existsSync(DIST_PATH)).toBe(true)
  })

  it("dynamic import of dist/index.js succeeds (no missing prompt files)", async () => {
    // This will throw if there are readFileSync calls for missing .md files
    const mod = await import(DIST_PATH)
    expect(mod).toBeDefined()
  })

  it("default export has id 'weave.attest' and server function", async () => {
    const mod = await import(DIST_PATH)
    const plugin = mod.default as PluginModule & { id: string }

    expect(plugin.id).toBe("weave.attest")
    expect(typeof plugin.server).toBe("function")
    expect(plugin.tui).toBeUndefined()
  })

  it("server() returns hooks with config, command.execute.before, and tool", async () => {
    const mod = await import(DIST_PATH)
    const plugin = mod.default as PluginModule & { id: string }

    const hooks = await plugin.server(createMockPluginInput() as never)
    expect(typeof hooks.config).toBe("function")
    expect(typeof hooks["command.execute.before"]).toBe("function")
    expect(typeof hooks.tool).toBe("object")
    expect(hooks.tool).not.toBeNull()
  })

  it("config hook sets mockConfig.command.attest and mockConfig.command['attest-resume']", async () => {
    const mod = await import(DIST_PATH)
    const plugin = mod.default as PluginModule & { id: string }

    const hooks = await plugin.server(createMockPluginInput() as never)
    const mockConfig = {} as Config
    await hooks.config!(mockConfig)

    const configWithCommand = mockConfig as { command?: Record<string, { template: string; description?: string }> }
    expect(configWithCommand.command?.["attest"]).toBeDefined()
    expect(configWithCommand.command?.["attest-resume"]).toBeDefined()

    const attestCmd = configWithCommand.command?.["attest"]
    expect(typeof attestCmd?.template).toBe("string")
    expect(attestCmd?.template).toContain("$SESSION_ID")
    expect(attestCmd?.template).toContain("attest_submit")
  })

  it("tool.attest_submit has description (string) and execute (function)", async () => {
    const mod = await import(DIST_PATH)
    const plugin = mod.default as PluginModule & { id: string }

    const hooks = await plugin.server(createMockPluginInput() as never)
    const submitTool = hooks.tool?.["attest_submit"]

    expect(submitTool).toBeDefined()
    expect(typeof submitTool?.description).toBe("string")
    expect(typeof submitTool?.execute).toBe("function")
  })

  it("ATTEST_COMMANDS is exported from dist/index.js", async () => {
    const mod = await import(DIST_PATH)
    expect(mod.ATTEST_COMMANDS).toBeDefined()
    expect(typeof mod.ATTEST_COMMANDS?.["attest"]).toBe("object")
    expect(typeof mod.ATTEST_COMMANDS?.["attest-resume"]).toBe("object")
  })
})
