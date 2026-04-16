import { describe, expect, it } from "bun:test"
import { createLiveLlmClient, createStubLlmClient } from "./client"

describe("llm client", () => {
  it("stub client returns validated question payloads", async () => {
    const client = createStubLlmClient()
    const result = await client.generateQuestions({
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      changedFiles: ["README.md"],
      diffSummary: "README updated",
    })

    expect(result.questions).toHaveLength(3)
    expect(result.questions[0]?.source).toBe("llm")
  })

  it("live client uses OpenCode structured session prompts", async () => {
    const calls: { create: number; promptAsync: unknown[]; messages: number; delete: unknown[] } = {
      create: 0,
      promptAsync: [],
      messages: 0,
      delete: [],
    }

    const client = createLiveLlmClient({
      directory: "/tmp/repo",
      now: () => 0,
      sleep: async () => undefined,
      timeoutMs: 100,
      client: {
        session: {
          async create() {
            calls.create += 1
            return { data: { id: "sess_live" } }
          },
          async promptAsync(input: unknown) {
            calls.promptAsync.push(input)
            return { data: undefined, error: undefined }
          },
          async messages() {
            calls.messages += 1
            return {
              data: [
                {
                  info: {
                    role: "assistant",
                    structured: {
                      questions: [{ id: "live-q1", prompt: "Explain the README update", kind: "how_it_works", source: "llm" }],
                    },
                  },
                  parts: [],
                },
              ],
            }
          },
          async delete(input: unknown) {
            calls.delete.push(input)
            return { data: true }
          },
        },
      } as never,
    })

    const result = await client.generateQuestions({
      intent: {
        summary: "Update plugin",
        motivation: "Validate flow",
        aiDisclosure: { used: true, contributionLevel: "medium" },
      },
      riskLevel: "medium",
      changedFiles: ["README.md"],
      diffSummary: "README updated",
    })

    expect(result.questions[0]?.id).toBe("live-q1")
    expect(calls.create).toBe(1)
    expect(calls.messages).toBe(1)
    expect(calls.promptAsync).toHaveLength(1)
    expect(calls.delete).toHaveLength(1)
    expect(calls.promptAsync[0]).toMatchObject({
      sessionID: "sess_live",
      directory: "/tmp/repo",
      format: { type: "json_schema" },
    })
  })
})
