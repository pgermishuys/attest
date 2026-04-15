import { describe, expect, it } from "bun:test"
import plugin from "../../src/entry-server"
import { ATTEST_COMMANDS } from "../../src/commands/definitions"

describe("opencode plugin load smoke", () => {
  it("exports a valid plugin module with the expected id", () => {
    expect(plugin.id).toBe("weave.attest")
    expect(typeof plugin.server).toBe("function")
  })

  it("does not export a tui property", () => {
    expect(plugin.tui).toBeUndefined()
  })

  it("registers /attest as a slash command via ATTEST_COMMANDS", () => {
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest")
    expect(typeof ATTEST_COMMANDS["attest"].template).toBe("string")
  })

  it("registers /attest-resume as a slash command via ATTEST_COMMANDS", () => {
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest-resume")
  })
})
