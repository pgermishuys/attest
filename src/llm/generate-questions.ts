import type { LlmQuestionGenerationInput, LlmQuestionGenerationOutput } from "../types"
import type { AttestLlmClient } from "./client"
import { createFallbackQuestions } from "./fallbacks"
import { questionGenerationPrompt } from "./prompts"

export { questionGenerationPrompt }

export const generateQuestions = async (
  client: AttestLlmClient,
  input: LlmQuestionGenerationInput,
): Promise<LlmQuestionGenerationOutput> => {
  void questionGenerationPrompt
  try {
    return await client.generateQuestions(input)
  } catch (error) {
    return createFallbackQuestions(input, error)
  }
}
