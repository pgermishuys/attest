import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { LlmQuestionGenerationInput, LlmQuestionGenerationOutput } from "../types"
import type { AttestLlmClient } from "./client"
import { createFallbackQuestions } from "./fallbacks"

const promptPath = join(import.meta.dir, "prompts", "generate-interview.md")

export const questionGenerationPrompt = readFileSync(promptPath, "utf8")

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
