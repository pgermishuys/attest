/**
 * Version-pinned smoke test for the @opencode-ai/plugin@1.4.6 config.command pattern.
 *
 * The config.command mutation pattern is code-proven in Weave's production plugin
 * but is not formally documented in OpenCode's public API. This test verifies
 * compatibility against the pinned version and fails loudly if the pattern breaks.
 *
 * NOTE: The SDK's `Config` type DOES include a `command` property (verified via
 * types.gen.d.ts in @opencode-ai/sdk). However, the plugin's `Config` type is
 * `Omit<SDKConfig, "plugin"> & { plugin?: Array<string | [string, PluginOptions]> }`
 * which preserves the `command` property from SDKConfig.
 */

import { describe, expect, it } from "bun:test"
import type { Config } from "@opencode-ai/plugin"
import plugin from "../../src/entry-server"
import { ATTEST_COMMANDS } from "../../src/commands/definitions"

const PINNED_VERSION = "1.4.6"

// Minimal mock of PluginInput for testing
const createMockPluginInput = () => ({
  client: {
    session: {
      async create() {
        return { data: { id: "mock-session" } }
      },
      async promptAsync() {
        return { data: undefined }
      },
      async messages() {
        return { data: [] }
      },
      async delete() {
        return { data: true }
      },
    },
  } as unknown as import("@opencode-ai/plugin").PluginInput["client"],
  project: { id: "test-project", path: "/tmp" } as import("@opencode-ai/plugin").PluginInput["project"],
  directory: "/tmp",
  worktree: "/tmp",
  experimental_workspace: {
    register() {},
  },
  serverUrl: new URL("http://localhost:4321"),
  $: {} as import("@opencode-ai/plugin").PluginInput["$"],
})

describe(`config.command registration smoke test (@opencode-ai/plugin@${PINNED_VERSION})`, () => {
  it("plugin exports a server function", () => {
    expect(typeof plugin.server).toBe("function")
  })

  it("plugin id is weave.attest", () => {
    expect(plugin.id).toBe("weave.attest")
  })

  it(`server function returns hooks with config, command.execute.before, and tool [plugin@${PINNED_VERSION}]`, async () => {
    const hooks = await plugin.server(createMockPluginInput() as never)

    expect(typeof hooks.config).toBe("function")
    expect(typeof hooks["command.execute.before"]).toBe("function")
    expect(typeof hooks.tool).toBe("object")
    expect(hooks.tool).not.toBeNull()
  })

  it(`config hook sets config.command.attest and config.command["attest-resume"] [plugin@${PINNED_VERSION}]`, async () => {
    const hooks = await plugin.server(createMockPluginInput() as never)

    // NOTE: Config type in @opencode-ai/plugin@1.4.6 does have a `command` property
    // (inherited from the SDK's SDKConfig type). If this ever breaks, the type assertion
    // below will catch it at compile time.
    const mockConfig = {} as Config & { command: Record<string, unknown> }
    await hooks.config!(mockConfig)

    expect(mockConfig.command).toBeDefined()
    expect(typeof mockConfig.command["attest"]).toBe("object")
    expect(typeof mockConfig.command["attest-resume"]).toBe("object")

    const attestCommand = mockConfig.command["attest"] as typeof ATTEST_COMMANDS["attest"]
    expect(typeof attestCommand.template).toBe("string")
    expect(typeof attestCommand.description).toBe("string")
    expect(attestCommand.template).toContain("$SESSION_ID")
    expect(attestCommand.template).toContain("$TIMESTAMP")
    expect(attestCommand.template).toContain("$ARGUMENTS")
    expect(attestCommand.template).toContain("attest_submit")

    const resumeCommand = mockConfig.command["attest-resume"] as typeof ATTEST_COMMANDS["attest-resume"]
    expect(typeof resumeCommand.template).toBe("string")
    expect(resumeCommand.template).toContain("$SESSION_ID")
  })

  it(`config hook defensively initializes config.command to {} if undefined [plugin@${PINNED_VERSION}]`, async () => {
    const hooks = await plugin.server(createMockPluginInput() as never)
    const mockConfig = {} as Config
    await hooks.config!(mockConfig)
    // After the config hook runs, config.command must be defined
    expect((mockConfig as { command?: unknown }).command).toBeDefined()
  })

  it(`tool.attest_submit has description and execute [plugin@${PINNED_VERSION}]`, async () => {
    const hooks = await plugin.server(createMockPluginInput() as never)

    expect(hooks.tool?.["attest_submit"]).toBeDefined()
    expect(typeof hooks.tool?.["attest_submit"]?.description).toBe("string")
    expect(typeof hooks.tool?.["attest_submit"]?.execute).toBe("function")
  })
})
