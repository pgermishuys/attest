import { describe, expect, it } from "bun:test"
import { createRiskClassification } from "../domain/risk"
import { computeVerdict } from "./compute-verdict"

const mediumRisk = createRiskClassification({
  level: "medium",
  categories: ["business_logic"],
  requiresHumanEscalation: false,
  rationale: [],
})

describe("computeVerdict", () => {
  it("returns PASS for all strong answers", () => {
    const verdict = computeVerdict({
      risk: mediumRisk,
      escalationFlags: [],
      ratings: [{ questionId: "q1", rating: "strong", rationale: "Clear." }],
    })

    expect(verdict).toBe("PASS")
  })

  it("returns PASS_WITH_WARNINGS when any answer is partial", () => {
    const verdict = computeVerdict({
      risk: mediumRisk,
      escalationFlags: [],
      ratings: [{ questionId: "q1", rating: "partial", rationale: "Thin." }],
    })

    expect(verdict).toBe("PASS_WITH_WARNINGS")
  })

  it("returns NEEDS_FOLLOWUP when any answer is weak", () => {
    const verdict = computeVerdict({
      risk: mediumRisk,
      escalationFlags: [],
      ratings: [{ questionId: "q1", rating: "weak", rationale: "Too vague." }],
    })

    expect(verdict).toBe("NEEDS_FOLLOWUP")
  })

  it("returns ESCALATE_TO_HUMAN when escalation flags are present", () => {
    const verdict = computeVerdict({
      risk: mediumRisk,
      escalationFlags: ["mandatory-human-review"],
      ratings: [{ questionId: "q1", rating: "strong", rationale: "Clear." }],
    })

    expect(verdict).toBe("ESCALATE_TO_HUMAN")
  })
})
