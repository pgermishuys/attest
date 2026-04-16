import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { LlmAnswerEvaluationInput, LlmAnswerEvaluationOutput } from "../types"
import type { AttestLlmClient } from "./client"
import { createFallbackEvaluation } from "./fallbacks"

const promptPath = join(import.meta.dir, "prompts", "evaluate-interview.md")

export const answerEvaluationPrompt = readFileSync(promptPath, "utf8")

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
