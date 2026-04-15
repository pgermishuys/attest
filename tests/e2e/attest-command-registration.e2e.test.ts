import { describe, expect, it } from "bun:test"
import { createAttestCommands } from "../../.opencode/plugins/attest/entry"
import { AttestRunCommandValue, AttestSlashCommandName } from "../../.opencode/plugins/attest/types"

describe("attest command registration", () => {
  it("creates a slash command for /attest", () => {
    const commands = createAttestCommands(() => undefined)
    const slashCommand = commands.find((command) => command.slash?.name === AttestSlashCommandName)

    expect(commands).toHaveLength(3)
    expect(slashCommand?.value).toBe(AttestRunCommandValue)
    expect(slashCommand?.slash?.name).toBe(AttestSlashCommandName)
    expect(slashCommand?.description).toContain("comprehension interview")
  })
})
