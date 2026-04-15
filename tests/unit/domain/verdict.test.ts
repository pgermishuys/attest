import { describe, expect, it } from "bun:test"
import { compareVerdicts, isPassingVerdict } from "../../../.opencode/plugins/attest/domain/verdict"

describe("verdict invariants", () => {
  it("orders verdict severity from pass to block", () => {
    expect(compareVerdicts("PASS", "BLOCK")).toBeLessThan(0)
    expect(compareVerdicts("ESCALATE_TO_HUMAN", "NEEDS_FOLLOWUP")).toBeGreaterThan(0)
  })

  it("identifies passing verdicts", () => {
    expect(isPassingVerdict("PASS")).toBe(true)
    expect(isPassingVerdict("PASS_WITH_WARNINGS")).toBe(true)
    expect(isPassingVerdict("NEEDS_FOLLOWUP")).toBe(false)
  })
})
