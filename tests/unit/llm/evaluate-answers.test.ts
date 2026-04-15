import { describe, expect, it } from "bun:test"
import type { AttestLlmClient } from "../../../.opencode/plugins/attest/llm/client"
import { createStubLlmClient } from "../../../.opencode/plugins/attest/llm/client"
import { answerEvaluationPrompt, evaluateAnswers } from "../../../.opencode/plugins/attest/llm/evaluate-answers"

describe("evaluateAnswers", () => {
  it("evaluates answers via the stub client contract", async () => {
    const result = await evaluateAnswers(createStubLlmClient(), {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      diffSummary: "Added plugin flow",
      questions: [{ id: "q1", prompt: "How?", kind: "how_it_works", source: "llm" }],
      answers: [{ questionId: "q1", answer: "This updates the plugin flow with enough detail.", answeredAt: "2026-04-15T09:30:00.000Z" }],
    })

    expect(answerEvaluationPrompt).toContain("answer evaluator")
    expect(result.recommendedVerdict).toBe("PASS")
  })

  it("falls back to safe deterministic evaluation on malformed LLM output", async () => {
    const malformedClient: AttestLlmClient = {
      async generateQuestions() {
        throw new Error("unused")
      },
      async evaluateAnswers() {
        throw new Error("bad payload")
      },
    }

    const result = await evaluateAnswers(malformedClient, {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      diffSummary: "Added plugin flow",
      questions: [{ id: "q1", prompt: "How?", kind: "how_it_works", source: "llm" }],
      answers: [{ questionId: "q1", answer: "This answer is long enough to be considered safely grounded by fallback scoring.", answeredAt: "2026-04-15T09:30:00.000Z" }],
    })

    expect(result.recommendedVerdict).toBe("PASS")
    expect(result.rationale[0]).toContain("LLM evaluation fallback used deterministic scoring")
  })
})
