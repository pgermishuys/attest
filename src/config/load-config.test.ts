import { describe, expect, it } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { defaultAttestConfig, loadAttestConfig } from "./load-config"

describe("loadAttestConfig", () => {
  it("returns defaults when no repo config exists", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-config-default-"))

    expect(loadAttestConfig(repoRoot)).toEqual(defaultAttestConfig)
  })

  it("merges repo config with defaults", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-config-custom-"))
    mkdirSync(join(repoRoot, ".attest"), { recursive: true })
    writeFileSync(
      join(repoRoot, ".attest", "config.json"),
      JSON.stringify({
        baseBranch: "develop",
        maxDiffCharacters: 500,
        allowFollowUps: false,
        maxQuestionsByRisk: {
          high: 8,
        },
      }),
    )

    expect(loadAttestConfig(repoRoot)).toEqual({
      ...defaultAttestConfig,
      baseBranch: "develop",
      maxDiffCharacters: 500,
      allowFollowUps: false,
      maxQuestionsByRisk: {
        low: 2,
        medium: 4,
        high: 8,
      },
    })
  })
})
