import type { RiskClassification } from "../domain/risk"

export const selectInterviewDepth = (risk: RiskClassification): number => {
  if (risk.level === "low") return 2
  if (risk.level === "high") return 5
  return 3
}
