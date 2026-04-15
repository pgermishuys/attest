export const AttestPluginId = "weave.attest"
export const AttestSlashCommandName = "attest"
export const AttestRunCommandValue = "attest.run"
export const AttestBranchCommandValue = "attest.branch"
export const AttestResumeCommandValue = "attest.resume"

export type AttestCommandValue = typeof AttestRunCommandValue

export const AiContributionLevels = ["none", "low", "medium", "high"] as const
export type AiContributionLevel = (typeof AiContributionLevels)[number]

export type AiDisclosure = {
  used: boolean
  contributionLevel: AiContributionLevel
  notes?: string
}

export type DeclaredIntent = {
  summary: string
  motivation: string
  aiDisclosure: AiDisclosure
}

export const InterviewQuestionKinds = [
  "how_it_works",
  "assumptions",
  "failure_mode",
  "rollback",
  "operations",
  "follow_up",
] as const

export type InterviewQuestionKind = (typeof InterviewQuestionKinds)[number]

export type InterviewQuestion = {
  id: string
  prompt: string
  kind: InterviewQuestionKind
  source: "deterministic" | "llm"
}

export type InterviewAnswer = {
  questionId: string
  answer: string
  answeredAt: string
}

export type QuestionRating = {
  questionId: string
  rating: "strong" | "partial" | "weak"
  rationale: string
}

// LLM-facing DTOs are intentionally separate from deterministic domain policies.
export type LlmQuestionGenerationInput = {
  intent: DeclaredIntent
  riskLevel: "low" | "medium" | "high"
  changedFiles: string[]
  diffSummary: string
}

export type LlmQuestionGenerationOutput = {
  questions: InterviewQuestion[]
}

export type LlmAnswerEvaluationInput = {
  intent: DeclaredIntent
  riskLevel: "low" | "medium" | "high"
  diffSummary: string
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
}

export type LlmAnswerEvaluationOutput = {
  ratings: QuestionRating[]
  recommendedVerdict: "PASS" | "PASS_WITH_WARNINGS" | "NEEDS_FOLLOWUP" | "ESCALATE_TO_HUMAN" | "BLOCK"
  rationale: string[]
  followUpQuestion?: InterviewQuestion
}

export type CollectedIntentInput = {
  summary: string
  motivation: string
  aiUsed: boolean
  aiContributionLevel: AiContributionLevel
  aiNotes?: string
}
