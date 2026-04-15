import { tool } from "@opencode-ai/plugin"
import type { AttestLlmClient } from "../llm/client"
import { loadAttestConfig } from "../config/load-config"
import { loadSession } from "../session/store"
import { storeSession } from "../session/store"
import { transitionSessionStatus } from "../domain/session"
import { createEvidenceRecord } from "../domain/evidence"
import { createEvidenceFilePaths } from "../evidence/pathing"
import { writeEvidenceJson } from "../evidence/write-json"
import { writeEvidenceMarkdown } from "../evidence/write-markdown"
import { evaluateInterviewPlan } from "../flow/build-interview-plan"
import { applyEscalationRules } from "../policy/apply-escalation-rules"
import { computeVerdict } from "../policy/compute-verdict"
import { sanitizeSessionId } from "../session/session-paths"
import { renderVerdict } from "../ui/render-verdict"

const mergeAnswers = (
  storedAnswers: Array<{ questionId: string; answer: string; answeredAt: string }>,
  submittedAnswers: Array<{ question_id: string; answer: string }>,
  answeredAt: string,
) => {
  const merged = new Map(storedAnswers.map((answer) => [answer.questionId, answer]))
  const lockedQuestionIds = new Set(storedAnswers.map((answer) => answer.questionId))

  for (const answer of submittedAnswers) {
    if (lockedQuestionIds.has(answer.question_id)) {
      continue
    }

    merged.set(answer.question_id, {
      questionId: answer.question_id,
      answer: answer.answer,
      answeredAt,
    })
  }

  return merged
}

export const createSubmitTool = (repoRoot: string, llmClient: AttestLlmClient) =>
  tool({
    description:
      "Submit answers to an Attest comprehension interview. Call this after collecting all answers from the user. Returns a verdict and writes evidence artifacts.",
    args: {
      session_id: tool.schema.string().min(1).describe("The session ID from the interview context"),
      answers: tool.schema
        .array(
          tool.schema.object({
            question_id: tool.schema.string().min(1).describe("The question ID"),
            answer: tool.schema.string().min(1).describe("The user's verbatim answer"),
          }),
        )
        .min(1)
        .describe("One entry per question with the user's exact answer"),
    },
    async execute(args) {
      const sanitizedSessionId = sanitizeSessionId(args.session_id)

      let session
      try {
        session = loadSession(repoRoot, sanitizedSessionId)
      } catch {
        return `Error: Session not found: ${args.session_id}`
      }

      const now = new Date().toISOString()
      const mergedAnswersByQuestionId = mergeAnswers(session.answers, args.answers, now)
      const answeredIds = new Set(mergedAnswersByQuestionId.keys())
      const missingIds = session.questions.map((q) => q.id).filter((id) => !answeredIds.has(id))
      if (missingIds.length > 0) {
        return `Error: Incomplete answers. Missing answers for question IDs: ${missingIds.join(", ")}`
      }

      const answers = session.questions.map((question) => {
        const answer = mergedAnswersByQuestionId.get(question.id)
        if (!answer) {
          throw new Error(`Missing merged answer for question ${question.id}`)
        }

        return answer
      })

      const intent = session.intent ?? {
        summary: "Understand the current change before submission.",
        motivation: "Validate understanding of the diff.",
        aiDisclosure: { used: false, contributionLevel: "none" as const },
      }
      const risk = session.risk!

      const evaluation = await evaluateInterviewPlan(llmClient, {
        intent,
        risk,
        diffContext: session.diffContext,
        questions: session.questions,
        answers,
      })

      const escalationFlags = applyEscalationRules(risk)
      const verdict = computeVerdict({
        risk,
        ratings: evaluation.ratings,
        escalationFlags,
      })

      const rationale = [
        `Attest session ${session.sessionId} completed.`,
        `Deterministic policy classified this change as ${risk.level} risk.`,
        `Captured ${session.questions.length} interview questions.`,
        ...evaluation.rationale,
        ...risk.rationale,
      ]

      const config = loadAttestConfig(repoRoot)
      const paths = createEvidenceFilePaths(repoRoot, config.evidenceDirectory, now)
      const evidence = createEvidenceRecord({
        sessionId: session.sessionId,
        generatedAt: now,
        repoRoot,
        diffContext: session.diffContext,
        intent,
        risk,
        questions: session.questions,
        answers,
        ratings: evaluation.ratings,
        verdict,
        rationale,
        escalationFlags,
      })

      writeEvidenceJson(paths.json, evidence)
      writeEvidenceMarkdown(paths.markdown, evidence)

      let updatedSession = transitionSessionStatus(
        {
          ...session,
          answers,
          updatedAt: now,
        },
        "evaluating_answers",
        now,
      )
      updatedSession = transitionSessionStatus(
        {
          ...updatedSession,
          verdict,
          evidencePath: paths.json,
        },
        "completed",
        now,
      )
      storeSession(repoRoot, updatedSession)

      return renderVerdict(verdict, rationale) + `\n\nEvidence written to:\n  JSON: ${paths.json}\n  Markdown: ${paths.markdown}`
    },
  })
