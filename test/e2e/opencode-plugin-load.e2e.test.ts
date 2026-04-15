import { describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import plugin from "../../src/entry"
import { createAttestCommands } from "../../src/entry"
import workspacePackage from "../../.opencode/package.json" assert { type: "json" }
import tuiConfig from "../../.opencode/tui.json" assert { type: "json" }

describe("opencode plugin load smoke", () => {
  it("has the expected workspace metadata for local plugin loading", () => {
    expect(tuiConfig.plugin[0]?.[0]).toBe("./plugins/attest.ts")
    expect(plugin.id).toBe("weave.attest")
    expect(createAttestCommands(() => undefined).some((command) => command.slash?.name === "attest")).toBe(true)
  })

  it("can materialize a minimal local .opencode config fixture", () => {
    const root = mkdtempSync(join(tmpdir(), "attest-smoke-"))
    mkdirSync(join(root, ".opencode", "plugins"), { recursive: true })
    writeFileSync(join(root, ".opencode", "tui.json"), JSON.stringify(tuiConfig, null, 2))
    writeFileSync(join(root, ".opencode", "package.json"), JSON.stringify(workspacePackage, null, 2))

    expect(JSON.parse(readFileSync(join(root, ".opencode", "tui.json"), "utf8")).plugin[0][0]).toBe("./plugins/attest.ts")
  })
})
