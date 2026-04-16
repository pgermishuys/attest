import type { Verdict } from "../domain/verdict"

export const renderVerdict = (verdict: Verdict, rationale: string[]): string => {
  return [`Verdict: ${verdict}`, ...rationale.map((item) => `- ${item}`)].join("\n")
}
