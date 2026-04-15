import type { LlmAnswerEvaluationOutput, LlmQuestionGenerationOutput, QuestionRating } from "../types"

const questionKinds = new Set(["how_it_works", "assumptions", "failure_mode", "rollback", "operations", "follow_up"])
const questionSources = new Set(["deterministic", "llm"])
const ratingValues = new Set(["strong", "partial", "weak"])
const verdictValues = new Set(["PASS", "PASS_WITH_WARNINGS", "NEEDS_FOLLOWUP", "ESCALATE_TO_HUMAN", "BLOCK"])

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value as Record<string, unknown>
}

const asString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }

  return value
}

const parseQuestion = (value: unknown) => {
  const record = asRecord(value, "question")
  const kind = asString(record.kind, "question.kind")
  const source = asString(record.source, "question.source")

  if (!questionKinds.has(kind)) throw new Error("question.kind is invalid")
  if (!questionSources.has(source)) throw new Error("question.source is invalid")

  return {
    id: asString(record.id, "question.id"),
    prompt: asString(record.prompt, "question.prompt"),
    kind,
    source,
  } as LlmQuestionGenerationOutput["questions"][number]
}

const parseRating = (value: unknown): QuestionRating => {
  const record = asRecord(value, "rating")
  const rating = asString(record.rating, "rating.rating")
  if (!ratingValues.has(rating)) throw new Error("rating.rating is invalid")

  return {
    questionId: asString(record.questionId, "rating.questionId"),
    rating: rating as QuestionRating["rating"],
    rationale: asString(record.rationale, "rating.rationale"),
  }
}

export const parseQuestionGeneration = (value: unknown): LlmQuestionGenerationOutput => {
  const record = asRecord(value, "questionGeneration")
  if (!Array.isArray(record.questions) || record.questions.length === 0) {
    throw new Error("questionGeneration.questions must be a non-empty array")
  }

  return {
    questions: record.questions.map(parseQuestion),
  }
}

export const parseAnswerEvaluation = (value: unknown): LlmAnswerEvaluationOutput => {
  const record = asRecord(value, "answerEvaluation")
  const recommendedVerdict = asString(record.recommendedVerdict, "answerEvaluation.recommendedVerdict")
  if (!verdictValues.has(recommendedVerdict)) {
    throw new Error("answerEvaluation.recommendedVerdict is invalid")
  }

  if (!Array.isArray(record.ratings)) {
    throw new Error("answerEvaluation.ratings must be an array")
  }

  if (!Array.isArray(record.rationale) || record.rationale.length === 0) {
    throw new Error("answerEvaluation.rationale must be a non-empty array")
  }

  return {
    ratings: record.ratings.map(parseRating),
    recommendedVerdict: recommendedVerdict as LlmAnswerEvaluationOutput["recommendedVerdict"],
    rationale: record.rationale.map((item, index) => asString(item, `answerEvaluation.rationale[${index}]`)),
    followUpQuestion: record.followUpQuestion ? parseQuestion(record.followUpQuestion) : undefined,
  }
}
