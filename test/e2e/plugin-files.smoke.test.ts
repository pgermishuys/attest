import { describe, expect, it } from "bun:test"
import { existsSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

describe("plugin scaffold smoke", () => {
  it("contains the expected workspace files", () => {
    expect(existsSync(join(root, ".opencode", "package.json"))).toBe(true)
    expect(existsSync(join(root, ".opencode", "tui.json"))).toBe(true)
    expect(existsSync(join(root, ".opencode", "plugins", "attest.ts"))).toBe(true)
    expect(existsSync(join(root, "src", "entry.ts"))).toBe(true)
  })
})
