import { describe, expect, it } from "bun:test"
import plugin from "../../.opencode/plugins/attest"
import { AttestPluginId } from "../../.opencode/plugins/attest/types"

describe("attest plugin module", () => {
  it("exports the expected plugin id", () => {
    expect(plugin.id).toBe(AttestPluginId)
  })

  it("exports a tui entrypoint", () => {
    expect(typeof plugin.tui).toBe("function")
  })
})
