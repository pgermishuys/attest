import type { DeclaredIntent, InterviewAnswer, InterviewQuestion } from "../types"
import type { DiffContext } from "./diff-context"
import type { RiskClassification } from "./risk"
import type { Verdict } from "./verdict"

export const SessionStatuses = ["collecting_context", "asking_questions", "evaluating_answers", "completed", "abandoned"] as const
export type SessionStatus = (typeof SessionStatuses)[number]

export type AttestSessionRecord = {
  sessionId: string
  createdAt: string
  updatedAt: string
  status: SessionStatus
  diffContext: DiffContext
  intent?: DeclaredIntent
  risk?: RiskClassification
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  verdict?: Verdict
  evidencePath?: string
}

const allowedTransitions: Record<SessionStatus, readonly SessionStatus[]> = {
  collecting_context: ["asking_questions", "abandoned"],
  asking_questions: ["evaluating_answers", "abandoned"],
  evaluating_answers: ["completed", "abandoned"],
  completed: [],
  abandoned: [],
}

export const createSessionRecord = (input: Omit<AttestSessionRecord, "status"> & { status?: SessionStatus }): AttestSessionRecord => {
  return {
    ...input,
    status: input.status ?? "collecting_context",
  }
}

export const transitionSessionStatus = (
  session: AttestSessionRecord,
  nextStatus: SessionStatus,
  updatedAt: string,
): AttestSessionRecord => {
  if (!allowedTransitions[session.status].includes(nextStatus)) {
    throw new Error(`Invalid session transition: ${session.status} -> ${nextStatus}`)
  }

  return {
    ...session,
    status: nextStatus,
    updatedAt,
  }
}
