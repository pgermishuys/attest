import { describe, expect, it } from "bun:test"
import { createRiskClassification } from "../domain/risk"
import { applyEscalationRules } from "./apply-escalation-rules"

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
