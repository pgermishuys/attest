import { describe, expect, it } from "bun:test"
import plugin from "./index"
import { AttestPluginId } from "./types"

describe("attest plugin module", () => {
  it("exports the expected plugin id", () => {
    expect(plugin.id).toBe(AttestPluginId)
  })

  it("exports a server entrypoint", () => {
    expect(typeof plugin.server).toBe("function")
  })

  it("does not export a tui entrypoint", () => {
    expect(plugin.tui).toBeUndefined()
  })
})
