import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { createStubLlmClient } from "../../.opencode/plugins/attest/llm/client"
import { evaluateAnswers } from "../../.opencode/plugins/attest/llm/evaluate-answers"
import { generateQuestions } from "../../.opencode/plugins/attest/llm/generate-questions"
import { renderEvalReport, type EvalRecord } from "./reporting"

const casesDirectory = join(import.meta.dir, "cases")

type QuestionRelevanceCase = {
  name: string
  intent: {
    summary: string
    motivation: string
    aiDisclosure: {
      used: boolean
      contributionLevel: "none" | "low" | "medium" | "high"
    }
  }
  riskLevel: "low" | "medium" | "high"
  changedFiles: string[]
  diffSummary: string
  expected: {
    minQuestions: number
    mustMention: string[]
  }
}

type VerdictConsistencyCase = {
  name: string
  intent: QuestionRelevanceCase["intent"]
  riskLevel: "low" | "medium" | "high"
  diffSummary: string
  questions: {
    id: string
    prompt: string
    kind: "how_it_works" | "assumptions" | "failure_mode" | "rollback" | "operations" | "follow_up"
    source: "llm"
  }[]
  answers: {
    questionId: string
    answer: string
    answeredAt: string
  }[]
  expected: {
    verdicts: string[]
  }
}

const client = createStubLlmClient()

const runQuestionRelevance = async (filePath: string): Promise<EvalRecord> => {
  const testCase = JSON.parse(readFileSync(filePath, "utf8")) as QuestionRelevanceCase
  const result = await generateQuestions(client, {
    intent: testCase.intent,
    riskLevel: testCase.riskLevel,
    changedFiles: testCase.changedFiles,
    diffSummary: testCase.diffSummary,
  })

  const combinedPrompts = result.questions.map((question) => question.prompt.toLowerCase()).join(" ")
  const mentions = testCase.expected.mustMention.every((token) => combinedPrompts.includes(token))
  const enoughQuestions = result.questions.length >= testCase.expected.minQuestions

  return {
    name: testCase.name,
    passed: mentions && enoughQuestions,
    details: [
      `questions: ${result.questions.length}`,
      `mentions required concepts: ${mentions}`,
    ],
  }
}

const runVerdictConsistency = async (filePath: string): Promise<EvalRecord> => {
  const testCase = JSON.parse(readFileSync(filePath, "utf8")) as VerdictConsistencyCase
  const result = await evaluateAnswers(client, {
    intent: testCase.intent,
    riskLevel: testCase.riskLevel,
    diffSummary: testCase.diffSummary,
    questions: testCase.questions,
    answers: testCase.answers,
  })

  return {
    name: testCase.name,
    passed: testCase.expected.verdicts.includes(result.recommendedVerdict),
    details: [
      `recommended verdict: ${result.recommendedVerdict}`,
      `ratings: ${result.ratings.map((rating) => `${rating.questionId}:${rating.rating}`).join(", ")}`,
    ],
  }
}

const main = async () => {
  const entries = readdirSync(casesDirectory).filter((entry) => entry.endsWith(".json"))
  const records: EvalRecord[] = []

  for (const entry of entries) {
    const filePath = join(casesDirectory, entry)
    if (entry.includes("question-relevance")) {
      records.push(await runQuestionRelevance(filePath))
      continue
    }

    if (entry.includes("verdict-consistency")) {
      records.push(await runVerdictConsistency(filePath))
    }
  }

  process.stdout.write(renderEvalReport(records))
}

await main()
