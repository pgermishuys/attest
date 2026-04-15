import type { Plugin, PluginModule } from "@opencode-ai/plugin"
import type { OpencodeClient } from "@opencode-ai/sdk/v2"
import { createLiveLlmClient } from "./llm/client"
import { ATTEST_COMMANDS } from "./commands/definitions"
import { createExecuteBeforeHandler } from "./commands/execute-handler"
import { createSubmitTool } from "./commands/submit-tool"
import { AttestPluginId } from "./types"

const server: Plugin = async (input) => {
  const { directory, worktree } = input
  // PluginInput.client is the v1 SDK client; cast to v2 which shares the same runtime shape
  const client = input.client as unknown as OpencodeClient
  const repoRoot = worktree
  const llmClient = createLiveLlmClient({ client, directory })

  return {
    config: async (config) => {
      if (!config.command) {
        config.command = {}
      }
      for (const [key, value] of Object.entries(ATTEST_COMMANDS)) {
        config.command[key] = {
          template: value.template,
          description: value.description,
        }
      }
    },
    "command.execute.before": createExecuteBeforeHandler(repoRoot, llmClient),
    tool: {
      attest_submit: createSubmitTool(repoRoot, llmClient),
    },
  }
}

const plugin: PluginModule & { id: string } = {
  id: AttestPluginId,
  server,
}

export default plugin
