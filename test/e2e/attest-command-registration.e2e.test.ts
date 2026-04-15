import { describe, expect, it } from "bun:test"
import type { Config } from "@opencode-ai/plugin"
import plugin from "../../src/entry-server"
import { ATTEST_COMMANDS } from "../../src/commands/definitions"

const createMockPluginInput = () => ({
  client: {} as import("@opencode-ai/plugin").PluginInput["client"],
  project: { id: "test", path: "/tmp" } as import("@opencode-ai/plugin").PluginInput["project"],
  directory: "/tmp",
  worktree: "/tmp",
  experimental_workspace: { register() {} },
  serverUrl: new URL("http://localhost:4321"),
  $: {} as import("@opencode-ai/plugin").PluginInput["$"],
})

describe("attest command registration", () => {
  it("ATTEST_COMMANDS contains attest and attest-resume keys", () => {
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest")
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest-resume")
  })

  it("attest command has expected interface shape", () => {
    const cmd = ATTEST_COMMANDS["attest"]
    expect(typeof cmd.name).toBe("string")
    expect(typeof cmd.description).toBe("string")
    expect(typeof cmd.template).toBe("string")
    expect(cmd.description).toContain("comprehension interview")
  })

  it("attest-resume command has expected interface shape", () => {
    const cmd = ATTEST_COMMANDS["attest-resume"]
    expect(typeof cmd.name).toBe("string")
    expect(typeof cmd.description).toBe("string")
    expect(typeof cmd.template).toBe("string")
  })

  it("config hook sets config.command correctly for both commands", async () => {
    const hooks = await plugin.server(createMockPluginInput() as never)
    const mockConfig = {} as Config
    await hooks.config!(mockConfig)

    const cmdConfig = mockConfig as { command?: Record<string, unknown> }
    expect(cmdConfig.command?.["attest"]).toBeDefined()
    expect(cmdConfig.command?.["attest-resume"]).toBeDefined()

    const attest = cmdConfig.command?.["attest"] as { template: string; description: string }
    expect(attest.template).toContain("$SESSION_ID")
    expect(attest.template).toContain("$TIMESTAMP")
    expect(attest.template).toContain("attest_submit")
  })
})
