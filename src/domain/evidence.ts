import type { DeclaredIntent, InterviewAnswer, InterviewQuestion, QuestionRating } from "../types"
import type { DiffContext } from "./diff-context"
import type { RiskClassification } from "./risk"
import type { Verdict } from "./verdict"

export type EvidenceRecord = {
  sessionId: string
  generatedAt: string
  repoRoot: string
  diffContext: DiffContext
  intent: DeclaredIntent
  risk: RiskClassification
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  ratings: QuestionRating[]
  verdict: Verdict
  rationale: string[]
  escalationFlags: string[]
}

export const createEvidenceRecord = (input: EvidenceRecord): EvidenceRecord => {
  return {
    ...input,
    escalationFlags: [...new Set(input.escalationFlags)],
  }
}
