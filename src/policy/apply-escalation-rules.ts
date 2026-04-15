import type { RiskClassification } from "../domain/risk"

export const applyEscalationRules = (risk: RiskClassification): string[] => {
  const flags: string[] = []

  if (risk.requiresHumanEscalation) {
    flags.push("mandatory-human-review")
  }

  return flags
}
