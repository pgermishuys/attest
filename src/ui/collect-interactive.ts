import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { CollectedIntentInput, InterviewQuestion } from "../types"

const cancellationError = () => new Error("Attest dialog cancelled.")

const promptForText = async (
  api: TuiPluginApi,
  input: {
    title: string
    placeholder?: string
    value?: string
    allowEmpty?: boolean
  },
): Promise<string> => {
  while (true) {
    const value = await new Promise<string>((resolve, reject) => {
      let settled = false

      const cancel = () => {
        if (settled) return
        settled = true
        api.ui.dialog.clear()
        reject(cancellationError())
      }

      api.ui.dialog.replace(
        () =>
          api.ui.DialogPrompt({
            title: input.title,
            placeholder: input.placeholder,
            value: input.value,
            onConfirm: (confirmedValue) => {
              if (settled) return
              settled = true
              api.ui.dialog.clear()
              resolve(confirmedValue)
            },
            onCancel: cancel,
          }),
        cancel,
      )
    })

    const trimmed = value.trim()
    if (trimmed || input.allowEmpty) {
      return trimmed
    }

    api.ui.toast({
      variant: "warning",
      title: "Attest",
      message: `${input.title} is required.`,
      duration: 2500,
    })
  }
}

const selectValue = async <Value>(
  api: TuiPluginApi,
  input: {
    title: string
    options: { title: string; value: Value; description?: string }[]
    current?: Value
  },
): Promise<Value> => {
  return new Promise<Value>((resolve, reject) => {
    let settled = false

    const cancel = () => {
      if (settled) return
      settled = true
      api.ui.dialog.clear()
      reject(cancellationError())
    }

    api.ui.dialog.replace(
      () =>
        api.ui.DialogSelect({
          title: input.title,
          options: input.options,
          current: input.current,
          skipFilter: true,
          onSelect: (option) => {
            if (settled) return
            settled = true
            api.ui.dialog.clear()
            resolve(option.value)
          },
        }),
      cancel,
    )
  })
}

export const collectIntentInteractively = async (api: TuiPluginApi): Promise<CollectedIntentInput> => {
  const summary = await promptForText(api, {
    title: "Attest summary",
    placeholder: "What changed in this diff?",
  })
  const motivation = await promptForText(api, {
    title: "Attest motivation",
    placeholder: "Why was this change made?",
  })
  const aiUsed = await selectValue(api, {
    title: "Did AI meaningfully contribute to this change?",
    options: [
      { title: "Yes", value: true, description: "AI wrote or materially shaped parts of the work" },
      { title: "No", value: false, description: "No meaningful AI contribution" },
    ],
  })

  if (!aiUsed) {
    return {
      summary,
      motivation,
      aiUsed: false,
      aiContributionLevel: "none",
    }
  }

  const aiContributionLevel = await selectValue<"low" | "medium" | "high">(api, {
    title: "How much did AI contribute?",
    options: [
      { title: "Low", value: "low", description: "Minor drafting or ideation help" },
      { title: "Medium", value: "medium", description: "AI helped shape meaningful parts of the change" },
      { title: "High", value: "high", description: "AI produced or heavily transformed much of the change" },
    ],
    current: "medium",
  })
  const aiNotes = await promptForText(api, {
    title: "AI notes",
    placeholder: "Optional context about how AI was used",
    allowEmpty: true,
  })

  return {
    summary,
    motivation,
    aiUsed: true,
    aiContributionLevel,
    aiNotes: aiNotes || undefined,
  }
}

export const collectAnswersInteractively = async (
  api: TuiPluginApi,
  questions: InterviewQuestion[],
): Promise<string[]> => {
  const answers: string[] = []

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index]
    answers.push(
      await promptForText(api, {
        title: `Question ${index + 1}/${questions.length}: ${question.prompt}`,
        placeholder: "Explain the change in your own words",
      }),
    )
  }

  return answers
}
