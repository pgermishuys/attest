import { describe, expect, it } from "bun:test"
import { parseAnswerEvaluation, parseQuestionGeneration } from "./schema"

describe("llm schema", () => {
  it("parses valid question generation payloads", () => {
    const result = parseQuestionGeneration({
      questions: [
        {
          id: "q1",
          prompt: "How does the code work?",
          kind: "how_it_works",
          source: "llm",
        },
      ],
    })

    expect(result.questions).toHaveLength(1)
  })

  it("rejects malformed answer evaluation payloads", () => {
    expect(() =>
      parseAnswerEvaluation({
        ratings: [],
        recommendedVerdict: "INVALID",
        rationale: [],
      }),
    ).toThrow()
  })
})
