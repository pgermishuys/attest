import { describe, expect, it } from "bun:test"
import type { AttestLlmClient } from "./client"
import { createStubLlmClient } from "./client"
import { generateQuestions, questionGenerationPrompt } from "./generate-questions"

describe("generateQuestions", () => {
  it("uses the stub client behind the contract boundary", async () => {
    const result = await generateQuestions(createStubLlmClient(), {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      changedFiles: ["src/plugin.ts"],
      diffSummary: "Added plugin flow",
    })

    expect(questionGenerationPrompt).toContain("interview question generator")
    expect(result.questions[0]?.prompt).toContain("medium-risk")
  })

  it("falls back to deterministic questions on malformed LLM output", async () => {
    const malformedClient: AttestLlmClient = {
      async generateQuestions() {
        throw new Error("bad payload")
      },
      async evaluateAnswers() {
        throw new Error("unused")
      },
    }

    const result = await generateQuestions(malformedClient, {
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      changedFiles: ["src/plugin.ts"],
      diffSummary: "Added plugin flow",
    })

    expect(result.questions[0]?.id).toBe("fallback-q1")
    expect(result.questions[0]?.source).toBe("deterministic")
    expect(result.questions[0]?.prompt).toContain("src/plugin.ts")
  })
})
