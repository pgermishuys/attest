import { describe, expect, it } from "bun:test"
import { createRiskClassification } from "../domain/risk"
import { selectInterviewDepth } from "./select-interview-depth"

describe("selectInterviewDepth", () => {
  it("returns the configured depth per risk level", () => {
    expect(
      selectInterviewDepth(
        createRiskClassification({
          level: "low",
          categories: ["docs"],
          requiresHumanEscalation: false,
          rationale: [],
        }),
      ),
    ).toBe(2)

    expect(
      selectInterviewDepth(
        createRiskClassification({
          level: "medium",
          categories: ["business_logic"],
          requiresHumanEscalation: false,
          rationale: [],
        }),
      ),
    ).toBe(3)

    expect(
      selectInterviewDepth(
        createRiskClassification({
          level: "high",
          categories: ["privacy"],
          requiresHumanEscalation: true,
          rationale: [],
        }),
      ),
    ).toBe(5)
  })
})
