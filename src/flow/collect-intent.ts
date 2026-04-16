import type { CollectedIntentInput, DeclaredIntent } from "../types"

export const collectIntent = (input: CollectedIntentInput): DeclaredIntent => {
  return {
    summary: input.summary.trim(),
    motivation: input.motivation.trim(),
    aiDisclosure: {
      used: input.aiUsed,
      contributionLevel: input.aiContributionLevel,
      notes: input.aiNotes?.trim() || undefined,
    },
  }
}
