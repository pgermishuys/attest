import { describe, expect, it } from "bun:test"
import { createRiskClassification } from "../../../.opencode/plugins/attest/domain/risk"
import { applyEscalationRules } from "../../../.opencode/plugins/attest/policy/apply-escalation-rules"

describe("applyEscalationRules", () => {
  it("returns a mandatory review flag for sensitive risks", () => {
    const flags = applyEscalationRules(
      createRiskClassification({
        level: "high",
        categories: ["privacy"],
        requiresHumanEscalation: true,
        rationale: [],
      }),
    )

    expect(flags).toEqual(["mandatory-human-review"])
  })
})
