import type { RiskClassification } from "../domain/risk"
import type { Verdict } from "../domain/verdict"
import type { QuestionRating } from "../types"

export type VerdictInput = {
  risk: RiskClassification
  ratings: QuestionRating[]
  escalationFlags: string[]
}

export const computeVerdict = ({ risk, ratings, escalationFlags }: VerdictInput): Verdict => {
  if (escalationFlags.length > 0 || risk.requiresHumanEscalation) return "ESCALATE_TO_HUMAN"
  if (ratings.some((rating) => rating.rating === "weak")) return "NEEDS_FOLLOWUP"
  if (ratings.some((rating) => rating.rating === "partial")) return "PASS_WITH_WARNINGS"
  return "PASS"
}
