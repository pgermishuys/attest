import { describe, expect, it } from "bun:test"
import { existsSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

describe("plugin scaffold smoke", () => {
  it("contains the expected tracked files", () => {
    // .opencode/tui.json and plugins/attest.ts are tracked in git
    expect(existsSync(join(root, ".opencode", "tui.json"))).toBe(true)
    expect(existsSync(join(root, ".opencode", "plugins", "attest.ts"))).toBe(true)
    expect(existsSync(join(root, "src", "entry.ts"))).toBe(true)
  })
})
