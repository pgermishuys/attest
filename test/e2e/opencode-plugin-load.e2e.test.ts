import { describe, expect, it } from "bun:test"
import plugin from "../../src/entry"
import { createAttestCommands } from "../../src/entry"

describe("opencode plugin load smoke", () => {
  it("exports a valid plugin module with the expected id", () => {
    expect(plugin.id).toBe("weave.attest")
    expect(typeof plugin.tui).toBe("function")
  })

  it("registers a slash command for /attest", () => {
    const commands = createAttestCommands(() => undefined)
    expect(commands.some((command) => command.slash?.name === "attest")).toBe(true)
  })
})
