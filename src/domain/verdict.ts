export const Verdicts = ["PASS", "PASS_WITH_WARNINGS", "NEEDS_FOLLOWUP", "ESCALATE_TO_HUMAN", "BLOCK"] as const
export type Verdict = (typeof Verdicts)[number]

const verdictSeverity: Record<Verdict, number> = {
  PASS: 0,
  PASS_WITH_WARNINGS: 1,
  NEEDS_FOLLOWUP: 2,
  ESCALATE_TO_HUMAN: 3,
  BLOCK: 4,
}

export const compareVerdicts = (left: Verdict, right: Verdict): number => {
  return verdictSeverity[left] - verdictSeverity[right]
}

export const isPassingVerdict = (verdict: Verdict): boolean => {
  return compareVerdicts(verdict, "NEEDS_FOLLOWUP") < 0
}
