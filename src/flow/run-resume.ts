import { loadLatestIncompleteSession } from "../session/load-latest"
import { resumeRun } from "../session/resume-run"
import type { AttestLlmClient } from "../llm/client"

export type RunResumeOptions = {
  repoRoot: string
  now: string
  answers?: string[]
  llmClient?: AttestLlmClient
  answerCollector?: (questions: import("../types").InterviewQuestion[]) => Promise<string[]>
}

export const runResume = async (options: RunResumeOptions) => {
  const session = loadLatestIncompleteSession(options.repoRoot)
  if (!session) {
    throw new Error("No incomplete Attest session found.")
  }

  return resumeRun({
    repoRoot: options.repoRoot,
    session,
    now: options.now,
    answers: options.answers,
    llmClient: options.llmClient,
    answerCollector: options.answerCollector,
  })
}
