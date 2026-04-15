import type {
  InterviewAnswer,
  InterviewQuestion,
  LlmAnswerEvaluationInput,
  LlmAnswerEvaluationOutput,
  LlmQuestionGenerationInput,
  LlmQuestionGenerationOutput,
} from "../types"

const deterministicFallbackQuestions: Omit<InterviewQuestion, "id">[] = [
  {
    prompt: "How does the main change in this diff work end to end?",
    kind: "how_it_works",
    source: "deterministic",
  },
  {
    prompt: "What assumption or edge case matters most in the changed code?",
    kind: "assumptions",
    source: "deterministic",
  },
  {
    prompt: "What would you inspect first if this failed after merge?",
    kind: "failure_mode",
    source: "deterministic",
  },
  {
    prompt: "How would you roll this change back safely if needed?",
    kind: "rollback",
    source: "deterministic",
  },
  {
    prompt: "What signal, alert, or test would you watch after deployment?",
    kind: "operations",
    source: "deterministic",
  },
]

const rateAnswer = (answer: InterviewAnswer) => {
  if (answer.answer.length >= 48) {
    return {
      questionId: answer.questionId,
      rating: "strong" as const,
      rationale: "Deterministic fallback judged this answer detailed enough to be grounded.",
    }
  }

  if (answer.answer.length >= 24) {
    return {
      questionId: answer.questionId,
      rating: "partial" as const,
      rationale: "Deterministic fallback found some useful detail but not enough depth.",
    }
  }

  return {
    questionId: answer.questionId,
    rating: "weak" as const,
    rationale: "Deterministic fallback judged this answer too short to show understanding.",
  }
}

export const createFallbackQuestions = (
  input: LlmQuestionGenerationInput,
  cause: unknown,
): LlmQuestionGenerationOutput => {
  const fileHint = input.changedFiles[0] ? ` Focus on ${input.changedFiles[0]}.` : ""

  return {
    questions: deterministicFallbackQuestions.map((question, index) => ({
      id: `fallback-q${index + 1}`,
      prompt: `${question.prompt}${fileHint}`,
      kind: question.kind,
      source: question.source,
    })),
  }
}

export const createFallbackEvaluation = (
  input: LlmAnswerEvaluationInput,
  cause: unknown,
): LlmAnswerEvaluationOutput => {
  const ratings = input.answers.map(rateAnswer)
  const recommendedVerdict = ratings.some((rating) => rating.rating === "weak")
    ? "NEEDS_FOLLOWUP"
    : ratings.some((rating) => rating.rating === "partial")
      ? "PASS_WITH_WARNINGS"
      : "PASS"

  return {
    ratings,
    recommendedVerdict,
    rationale: [
      `LLM evaluation fallback used deterministic scoring after a malformed response: ${String(cause)}`,
    ],
  }
}
