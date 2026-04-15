import { describe, expect, it } from "bun:test"
import { createDiffContext } from "./diff-context"
import { createEvidenceRecord } from "./evidence"
import { createRiskClassification } from "./risk"

describe("evidence record", () => {
  it("serializes deterministically and deduplicates escalation flags", () => {
    const record = createEvidenceRecord({
      sessionId: "ses_123",
      generatedAt: "2026-04-15T08:10:00.000Z",
      repoRoot: "/tmp/attest",
      diffContext: createDiffContext({
        mode: "branch",
        target: "main...HEAD",
        changedFiles: [{ path: "src/app.ts", status: "modified", additions: 4, deletions: 1 }],
        truncated: false,
      }),
      intent: {
        summary: "Add attestation scaffold",
        motivation: "Validate plugin structure",
        aiDisclosure: {
          used: true,
          contributionLevel: "medium",
          notes: "Used for draft wording",
        },
      },
      risk: createRiskClassification({
        level: "medium",
        categories: ["multi_file_feature"],
        requiresHumanEscalation: false,
        rationale: ["Touches plugin and tests"],
      }),
      questions: [{ id: "q1", prompt: "How does the plugin register /attest?", kind: "how_it_works", source: "llm" }],
      answers: [{ questionId: "q1", answer: "Via api.command.register.", answeredAt: "2026-04-15T08:09:00.000Z" }],
      ratings: [{ questionId: "q1", rating: "strong", rationale: "Concrete and grounded." }],
      verdict: "PASS_WITH_WARNINGS",
      rationale: ["Understands the registration flow."],
      escalationFlags: ["manual-review", "manual-review"],
    })

    expect(record.escalationFlags).toEqual(["manual-review"])

    expect(JSON.parse(JSON.stringify(record))).toEqual(record)
  })
})
