import { describe, expect, it } from "bun:test"
import { createStubLlmClient } from "../../.opencode/plugins/attest/llm/client"
import { evaluateAnswers } from "../../.opencode/plugins/attest/llm/evaluate-answers"
import { generateQuestions } from "../../.opencode/plugins/attest/llm/generate-questions"

describe("llm contract flow", () => {
  it("can generate questions and evaluate answers without changing orchestration code", async () => {
    const client = createStubLlmClient()
    const questions = await generateQuestions(client, {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      changedFiles: ["src/plugin.ts"],
      diffSummary: "Added plugin flow",
    })

    const evaluation = await evaluateAnswers(client, {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      diffSummary: "Added plugin flow",
      questions: questions.questions,
      answers: questions.questions.map((question) => ({
        questionId: question.id,
        answer: "This answer is long enough to count as strong in the stub client.",
        answeredAt: "2026-04-15T09:30:00.000Z",
      })),
    })

    expect(questions.questions).toHaveLength(3)
    expect(evaluation.recommendedVerdict).toBe("PASS")
    expect(evaluation.ratings).toHaveLength(3)
  })
})
