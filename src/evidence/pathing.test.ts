import { describe, expect, it } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createEvidenceFilePaths } from "./pathing"

describe("evidence pathing", () => {
  it("creates deterministic file paths under the evidence directory", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-paths-"))
    const paths = createEvidenceFilePaths(repoRoot, ".attest/runs", "2026-04-15T09:00:00.000Z")

    expect(paths.directory).toEndWith(`${join(".attest", "runs")}`)
    expect(paths.json).toContain("2026-04-15T09-00-00.000Z.json")
    expect(paths.markdown).toContain("2026-04-15T09-00-00.000Z.md")
  })

  it("rejects evidence directories that escape the repo root", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-paths-"))

    expect(() => createEvidenceFilePaths(repoRoot, "../outside", "2026-04-15T09:00:00.000Z")).toThrow(
      "evidenceDirectory must stay within the repository root.",
    )
  })
})
