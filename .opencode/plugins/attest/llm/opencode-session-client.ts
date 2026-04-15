import type { OpencodeClient } from "@opencode-ai/sdk/v2"

type StructuredPromptPayload = {
  system: string
  prompt: string
  schema: Record<string, unknown>
}

export type OpenCodeSessionClient = {
  promptStructuredJson: (payload: StructuredPromptPayload) => Promise<unknown>
}

export type CreateOpenCodeSessionClientOptions = {
  client: OpencodeClient
  directory: string
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  pollIntervalMs?: number
  timeoutMs?: number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const getErrorMessage = (value: unknown): string => {
  if (value && typeof value === "object" && "message" in value && typeof value.message === "string") {
    return value.message
  }

  return String(value)
}

const unwrapResult = <T>(result: { data?: T; error?: unknown }): T => {
  if (typeof result.error !== "undefined") {
    throw new Error(getErrorMessage(result.error))
  }

  if (typeof result.data === "undefined") {
    throw new Error("OpenCode client returned no data.")
  }

  return result.data
}

export const createOpenCodeSessionClient = (
  options: CreateOpenCodeSessionClientOptions,
): OpenCodeSessionClient => {
  const pollIntervalMs = options.pollIntervalMs ?? 100
  const timeoutMs = options.timeoutMs ?? 15_000
  const sleep = options.sleep ?? defaultSleep
  const now = options.now ?? Date.now

  return {
    async promptStructuredJson(payload) {
      const session = unwrapResult(await options.client.session.create({
        directory: options.directory,
        title: "Attest live LLM helper",
      }))

      const sessionID = session.id

      try {
        await options.client.session.promptAsync({
          sessionID,
          directory: options.directory,
          format: {
            type: "json_schema",
            schema: payload.schema,
            retryCount: 1,
          },
          system: payload.system,
          parts: [{ type: "text", text: payload.prompt }],
        })

        const startedAt = now()
        while (now() - startedAt <= timeoutMs) {
          const messages = unwrapResult(await options.client.session.messages({
            sessionID,
            directory: options.directory,
            limit: 20,
          }))

          const assistantMessage = [...messages].reverse().find((entry) => entry.info.role === "assistant")
          if (assistantMessage && assistantMessage.info.role === "assistant") {
            if (assistantMessage.info.error) {
              throw new Error(`OpenCode session prompt failed: ${getErrorMessage(assistantMessage.info.error)}`)
            }

            if (typeof assistantMessage.info.structured !== "undefined") {
              return assistantMessage.info.structured
            }
          }

          await sleep(pollIntervalMs)
        }

        throw new Error(`OpenCode structured prompt timed out after ${timeoutMs}ms`)
      } finally {
        await options.client.session.delete({
          sessionID,
          directory: options.directory,
        }).catch(() => undefined)
      }
    },
  }
}
