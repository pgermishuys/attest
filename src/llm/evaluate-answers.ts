import type { LlmAnswerEvaluationInput, LlmAnswerEvaluationOutput } from "../types"
import type { AttestLlmClient } from "./client"
import { createFallbackEvaluation } from "./fallbacks"
import { answerEvaluationPrompt } from "./prompts"

export { answerEvaluationPrompt }

export const evaluateAnswers = async (
  client: AttestLlmClient,
  input: LlmAnswerEvaluationInput,
): Promise<LlmAnswerEvaluationOutput> => {
  void answerEvaluationPrompt
  try {
    return await client.evaluateAnswers(input)
  } catch (error) {
    return createFallbackEvaluation(input, error)
  }
}
