import { describe, expect, it } from "bun:test"
import tuiConfig from "../../.opencode/tui.json" assert { type: "json" }

describe("plugin workspace config", () => {
  it("registers the local attest plugin in tui.json", () => {
    expect(Array.isArray(tuiConfig.plugin)).toBe(true)
    expect(tuiConfig.plugin[0]?.[0]).toBe("./plugins/attest.ts")
  })
})
