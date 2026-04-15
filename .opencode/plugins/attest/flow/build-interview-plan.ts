import type { DiffContext } from "../domain/diff-context"
import type { RiskClassification } from "../domain/risk"
import type { DeclaredIntent, InterviewQuestion, LlmAnswerEvaluationOutput } from "../types"
import type { AttestLlmClient } from "../llm/client"
import { evaluateAnswers } from "../llm/evaluate-answers"
import { generateQuestions } from "../llm/generate-questions"

export type InterviewPlan = {
  questions: InterviewQuestion[]
}

export const buildInterviewPlan = async (
  client: AttestLlmClient,
  input: {
    intent: DeclaredIntent
    risk: RiskClassification
    diffContext: DiffContext
  },
): Promise<InterviewPlan> => {
  const generated = await generateQuestions(client, {
    intent: input.intent,
    riskLevel: input.risk.level,
    changedFiles: input.diffContext.changedFiles.map((file) => file.path),
    diffSummary: input.diffContext.diffText ?? `${input.diffContext.summary.filesChanged} files changed`,
  })

  return {
    questions: generated.questions,
  }
}

export const evaluateInterviewPlan = async (
  client: AttestLlmClient,
  input: {
    intent: DeclaredIntent
    risk: RiskClassification
    diffContext: DiffContext
    questions: InterviewQuestion[]
    answers: { questionId: string; answer: string; answeredAt: string }[]
  },
): Promise<LlmAnswerEvaluationOutput> => {
  return evaluateAnswers(client, {
    intent: input.intent,
    riskLevel: input.risk.level,
    diffSummary: input.diffContext.diffText ?? `${input.diffContext.summary.filesChanged} files changed`,
    questions: input.questions,
    answers: input.answers,
  })
}
