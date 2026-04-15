import { createEvidenceRecord } from "../domain/evidence"
import { createSessionRecord, transitionSessionStatus } from "../domain/session"
import type { Verdict } from "../domain/verdict"
import { collectIntent } from "./collect-intent"
import { buildInterviewPlan, evaluateInterviewPlan } from "./build-interview-plan"
import { createEvidenceFilePaths } from "../evidence/pathing"
import { writeEvidenceJson } from "../evidence/write-json"
import { writeEvidenceMarkdown } from "../evidence/write-markdown"
import { collectDiffContext } from "../git/collect-diff-context"
import { resolveDiffTarget } from "../git/resolve-diff-target"
import { loadAttestConfig } from "../config/load-config"
import type { InterviewAnswer, InterviewQuestion } from "../types"
import { applyEscalationRules } from "../policy/apply-escalation-rules"
import { classifyRisk } from "../policy/classify-risk"
import { computeVerdict } from "../policy/compute-verdict"
import { selectInterviewDepth } from "../policy/select-interview-depth"
import { createStubLlmClient, type AttestLlmClient } from "../llm/client"
import { renderSummary } from "../ui/render-summary"
import { renderVerdict } from "../ui/render-verdict"
import { storeSession } from "../session/store"
import { sanitizeSessionId } from "../session/session-paths"
import type { DiffMode } from "../domain/diff-context"

export type RunAttestOptions = {
  repoRoot: string
  sessionId: string
  now: string
  llmClient?: AttestLlmClient
  stopAfterQuestions?: boolean
  requestedDiffMode?: DiffMode
  intentInput?: {
    summary?: string
    motivation?: string
    aiUsed?: boolean
    aiContributionLevel?: "none" | "low" | "medium" | "high"
    aiNotes?: string
  }
  answers?: string[]
  answerCollector?: (questions: InterviewQuestion[]) => Promise<string[]>
}

export type RunAttestResult = {
  verdict: Verdict
  evidenceJsonPath: string
  evidenceMarkdownPath: string
  questionCount: number
  sessionStatus: "completed"
  summary: string
  verdictText: string
  sessionId: string
}

export const runAttest = async (options: RunAttestOptions): Promise<RunAttestResult> => {
  const sessionId = sanitizeSessionId(options.sessionId)
  const llmClient = options.llmClient ?? createStubLlmClient()
  const config = loadAttestConfig(options.repoRoot)
  const target = resolveDiffTarget({
    repoRoot: options.repoRoot,
    baseBranch: config.baseBranch,
    requestedMode: options.requestedDiffMode ?? config.defaultDiffMode,
  })
  const diffContext = collectDiffContext({
    repoRoot: options.repoRoot,
    target,
    maxDiffCharacters: config.maxDiffCharacters,
  })

  const intent = collectIntent({
    summary: options.intentInput?.summary ?? "Understand the current change before submission.",
    motivation: options.intentInput?.motivation ?? "Validate the Attest workflow.",
    aiUsed: options.intentInput?.aiUsed ?? true,
    aiContributionLevel: options.intentInput?.aiContributionLevel ?? "medium",
    aiNotes: options.intentInput?.aiNotes,
  })

  const risk = classifyRisk(diffContext)
  const questionCount = selectInterviewDepth(risk)
  const interviewPlan = await buildInterviewPlan(llmClient, {
    intent,
    risk,
    diffContext,
  })
  const questions = interviewPlan.questions.slice(0, questionCount)

  const answerValues = options.answers ?? (options.answerCollector ? await options.answerCollector(questions) : undefined)
  const answers: InterviewAnswer[] = questions.map((question, index) => ({
    questionId: question.id,
    answer: answerValues?.[index] ?? "Stub answer captured for scaffold flow.",
    answeredAt: options.now,
  }))

  let session = createSessionRecord({
    sessionId,
    createdAt: options.now,
    updatedAt: options.now,
    diffContext,
    intent,
    risk,
    questions,
    answers,
  })
  session = transitionSessionStatus(session, "asking_questions", options.now)
  storeSession(options.repoRoot, session)

  if (options.stopAfterQuestions) {
    return {
      verdict: "NEEDS_FOLLOWUP",
      evidenceJsonPath: "",
      evidenceMarkdownPath: "",
      questionCount: questions.length,
      sessionStatus: "completed",
      summary: renderSummary(diffContext, risk),
      verdictText: renderVerdict("NEEDS_FOLLOWUP", ["Session paused after question capture."]),
      sessionId,
    }
  }

  const evaluation = await evaluateInterviewPlan(llmClient, {
    intent,
    risk,
    diffContext,
    questions,
    answers,
  })
  const ratings = evaluation.ratings
  const escalationFlags = applyEscalationRules(risk)
  const verdict: Verdict = computeVerdict({
    risk,
    ratings,
    escalationFlags,
  })
  const rationale = [
    `Deterministic policy classified this change as ${risk.level} risk.`,
    `Captured ${questions.length} interview questions.`,
    ...evaluation.rationale,
    ...risk.rationale,
  ]

  session = transitionSessionStatus(session, "evaluating_answers", options.now)
  storeSession(options.repoRoot, session)

  const paths = createEvidenceFilePaths(options.repoRoot, config.evidenceDirectory, options.now)
  const evidence = createEvidenceRecord({
    sessionId,
    generatedAt: options.now,
    repoRoot: options.repoRoot,
    diffContext,
    intent,
    risk,
    questions,
    answers,
    ratings,
    verdict,
    rationale,
    escalationFlags,
  })

  writeEvidenceJson(paths.json, evidence)
  writeEvidenceMarkdown(paths.markdown, evidence)

  session = transitionSessionStatus(
    {
      ...session,
      verdict,
      evidencePath: paths.json,
      answers,
    },
    "completed",
    options.now,
  )
  storeSession(options.repoRoot, session)

  const summary = renderSummary(diffContext, risk)
  const verdictText = renderVerdict(verdict, rationale)

  return {
    verdict,
    evidenceJsonPath: paths.json,
    evidenceMarkdownPath: paths.markdown,
    questionCount: questions.length,
    sessionStatus: "completed",
    summary,
    verdictText,
    sessionId,
  }
}
