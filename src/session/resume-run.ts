import { createEvidenceRecord } from "../domain/evidence"
import { transitionSessionStatus, type AttestSessionRecord } from "../domain/session"
import type { Verdict } from "../domain/verdict"
import { loadAttestConfig } from "../config/load-config"
import { createEvidenceFilePaths } from "../evidence/pathing"
import { writeEvidenceJson } from "../evidence/write-json"
import { writeEvidenceMarkdown } from "../evidence/write-markdown"
import type { InterviewAnswer } from "../types"
import { applyEscalationRules } from "../policy/apply-escalation-rules"
import { computeVerdict } from "../policy/compute-verdict"
import type { AttestLlmClient } from "../llm/client"
import { createStubLlmClient } from "../llm/client"
import { evaluateInterviewPlan } from "../flow/build-interview-plan"
import { renderSummary } from "../ui/render-summary"
import { renderVerdict } from "../ui/render-verdict"
import { storeSession } from "./store"
import type { InterviewQuestion } from "../types"

export type ResumeRunOptions = {
  repoRoot: string
  session: AttestSessionRecord
  now: string
  answers?: string[]
  llmClient?: AttestLlmClient
  answerCollector?: (questions: InterviewQuestion[]) => Promise<string[]>
}

export type ResumeRunResult = {
  verdict: Verdict
  evidenceJsonPath: string
  evidenceMarkdownPath: string
  summary: string
  verdictText: string
}

export const resumeRun = async (options: ResumeRunOptions): Promise<ResumeRunResult> => {
  const llmClient = options.llmClient ?? createStubLlmClient()
  const config = loadAttestConfig(options.repoRoot)
  const remainingQuestions = options.session.questions.slice(options.session.answers.length)
  const answerValues = options.answers ?? (options.answerCollector ? await options.answerCollector(remainingQuestions) : undefined)
  const newAnswers: InterviewAnswer[] = remainingQuestions.map((question, index) => ({
    questionId: question.id,
    answer: answerValues?.[index] ?? "Resumed answer captured for scaffold flow.",
    answeredAt: options.now,
  }))

  const allAnswers = [...options.session.answers, ...newAnswers]
  const evaluation = await evaluateInterviewPlan(llmClient, {
    intent: options.session.intent!,
    risk: options.session.risk!,
    diffContext: options.session.diffContext,
    questions: options.session.questions,
    answers: allAnswers,
  })
  const escalationFlags = applyEscalationRules(options.session.risk!)
  const verdict: Verdict = computeVerdict({
    risk: options.session.risk!,
    ratings: evaluation.ratings,
    escalationFlags,
  })
  const rationale = [
    `Resumed Attest session ${options.session.sessionId}.`,
    ...evaluation.rationale,
    ...options.session.risk!.rationale,
  ]

  let updatedSession = transitionSessionStatus(
    {
      ...options.session,
      answers: allAnswers,
      updatedAt: options.now,
    },
    "evaluating_answers",
    options.now,
  )

  const paths = createEvidenceFilePaths(options.repoRoot, config.evidenceDirectory, options.now)
  const evidence = createEvidenceRecord({
    sessionId: options.session.sessionId,
    generatedAt: options.now,
    repoRoot: options.repoRoot,
    diffContext: options.session.diffContext,
    intent: options.session.intent!,
    risk: options.session.risk!,
    questions: options.session.questions,
    answers: allAnswers,
    ratings: evaluation.ratings,
    verdict,
    rationale,
    escalationFlags,
  })

  writeEvidenceJson(paths.json, evidence)
  writeEvidenceMarkdown(paths.markdown, evidence)

  updatedSession = transitionSessionStatus(
    {
      ...updatedSession,
      verdict,
      evidencePath: paths.json,
    },
    "completed",
    options.now,
  )
  storeSession(options.repoRoot, updatedSession)

  return {
    verdict,
    evidenceJsonPath: paths.json,
    evidenceMarkdownPath: paths.markdown,
    summary: renderSummary(options.session.diffContext, options.session.risk!),
    verdictText: renderVerdict(verdict, rationale),
  }
}
