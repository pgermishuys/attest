import { describe, expect, it } from "bun:test"
import { createRiskClassification } from "../../../.opencode/plugins/attest/domain/risk"

describe("risk classification", () => {
  it("deduplicates and sorts categories", () => {
    const risk = createRiskClassification({
      level: "medium",
      categories: ["api_behavior", "business_logic", "api_behavior"],
      requiresHumanEscalation: false,
      rationale: ["API changed"],
    })

    expect(risk.categories).toEqual(["api_behavior", "business_logic"])
  })

  it("forces escalation for sensitive categories", () => {
    const risk = createRiskClassification({
      level: "high",
      categories: ["privacy", "business_logic"],
      requiresHumanEscalation: false,
      rationale: ["PII involved"],
    })

    expect(risk.requiresHumanEscalation).toBe(true)
  })
})
