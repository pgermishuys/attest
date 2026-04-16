import type { TuiCommand, TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { runAttest } from "./flow/run-attest"
import { runResume } from "./flow/run-resume"
import { createLiveLlmClient, createStubLlmClient, type AttestLlmClient } from "./llm/client"
import {
  AttestBranchCommandValue,
  AttestPluginId,
  AttestResumeCommandValue,
  AttestRunCommandValue,
  AttestSlashCommandName,
} from "./types"
import { collectAnswersInteractively, collectIntentInteractively } from "./ui/collect-interactive"

export const createAttestCommands = (onRun: () => void): TuiCommand[] => [
  {
    title: "Attest",
    value: AttestRunCommandValue,
    description: "Run an Attest comprehension interview",
    category: "Plugin",
    slash: {
      name: AttestSlashCommandName,
    },
    onSelect: onRun,
  },
  {
    title: "Attest branch",
    value: AttestBranchCommandValue,
    description: "Run Attest against the current branch diff",
    category: "Plugin",
    onSelect: onRun,
  },
  {
    title: "Attest resume",
    value: AttestResumeCommandValue,
    description: "Resume the latest Attest session",
    category: "Plugin",
    onSelect: onRun,
  },
]

const createSessionId = (): string => `attest_${Date.now()}`

const showSuccessToast = (
  api: TuiPluginApi,
  input: {
    verdict: string
    messageSuffix: string
  },
) => {
  api.ui.toast({
    variant: "success",
    title: "Attest",
    message: `${input.verdict} · ${input.messageSuffix}`,
    duration: 2500,
  })
}

const showErrorToast = (api: TuiPluginApi, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  api.ui.toast({
    variant: message.includes("cancelled") ? "warning" : "error",
    title: "Attest",
    message,
    duration: 3000,
  })
}

const resolveLlmClient = (api: TuiPluginApi): AttestLlmClient => {
  try {
    if (!api.client?.session?.create || !api.client?.session?.promptAsync || !api.client?.session?.messages) {
      return createStubLlmClient()
    }

    return createLiveLlmClient({
      client: api.client,
      directory: api.state.path.worktree,
    })
  } catch {
    return createStubLlmClient()
  }
}

const runInteractiveAttest = async (api: TuiPluginApi, requestedDiffMode?: "branch") => {
  try {
    const result = await runAttest({
      repoRoot: api.state.path.worktree,
      sessionId: createSessionId(),
      now: new Date().toISOString(),
      llmClient: resolveLlmClient(api),
      requestedDiffMode,
      intentInput: await collectIntentInteractively(api),
      answerCollector: (questions) => collectAnswersInteractively(api, questions),
    })

    showSuccessToast(api, {
      verdict: result.verdict,
      messageSuffix: `wrote ${result.questionCount} questions to evidence`,
    })
  } catch (error) {
    showErrorToast(api, error)
  }
}

const runInteractiveResume = async (api: TuiPluginApi) => {
  try {
    const result = await runResume({
      repoRoot: api.state.path.worktree,
      now: new Date().toISOString(),
      llmClient: resolveLlmClient(api),
      answerCollector: (questions) => collectAnswersInteractively(api, questions),
    })

    showSuccessToast(api, {
      verdict: result.verdict,
      messageSuffix: "resumed session",
    })
  } catch (error) {
    showErrorToast(api, error)
  }
}

export const tui: TuiPlugin = async (api) => {
  api.command.register(() => [
    {
      ...createAttestCommands(async () => undefined)[0],
      onSelect: async () => runInteractiveAttest(api),
    },
    {
      ...createAttestCommands(async () => undefined)[1],
      onSelect: async () => runInteractiveAttest(api, "branch"),
    },
    {
      ...createAttestCommands(async () => undefined)[2],
      onSelect: async () => runInteractiveResume(api),
    },
  ])
}

const plugin: TuiPluginModule & { id: string } = {
  id: AttestPluginId,
  tui,
}

export default plugin
