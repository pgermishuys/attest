import type { DiffContext } from "../domain/diff-context"
import type { RiskClassification } from "../domain/risk"

export const renderSummary = (diffContext: DiffContext, risk: RiskClassification): string => {
  return [
    `Attest summary`,
    `- target: ${diffContext.target}`,
    `- mode: ${diffContext.mode}`,
    `- files changed: ${diffContext.summary.filesChanged}`,
    `- risk: ${risk.level}`,
  ].join("\n")
}
