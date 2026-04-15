import { describe, expect, it } from "bun:test"
import { createDiffContext } from "../../../.opencode/plugins/attest/domain/diff-context"
import { createEvidenceRecord } from "../../../.opencode/plugins/attest/domain/evidence"
import { createRiskClassification } from "../../../.opencode/plugins/attest/domain/risk"
import { renderEvidenceMarkdown } from "../../../.opencode/plugins/attest/evidence/write-markdown"

describe("renderEvidenceMarkdown", () => {
  it("renders a readable evidence summary", () => {
    const markdown = renderEvidenceMarkdown(
      createEvidenceRecord({
        sessionId: "ses_1",
        generatedAt: "2026-04-15T09:00:00.000Z",
        repoRoot: "/tmp/attest",
        diffContext: createDiffContext({
          mode: "staged",
          target: "staged",
          changedFiles: [{ path: "README.md", status: "modified", additions: 2, deletions: 1 }],
          truncated: false,
        }),
        intent: {
          summary: "Update README",
          motivation: "Document plugin flow",
          aiDisclosure: {
            used: true,
            contributionLevel: "medium",
          },
        },
        risk: createRiskClassification({
          level: "low",
          categories: ["docs"],
          requiresHumanEscalation: false,
          rationale: ["Documentation only"],
        }),
        questions: [{ id: "q1", prompt: "What changed?", kind: "how_it_works", source: "deterministic" }],
        answers: [{ questionId: "q1", answer: "Updated the README.", answeredAt: "2026-04-15T09:00:00.000Z" }],
        ratings: [{ questionId: "q1", rating: "partial", rationale: "Stubbed" }],
        verdict: "PASS_WITH_WARNINGS",
        rationale: ["Initial scaffold flow."],
        escalationFlags: [],
      }),
    )

    expect(markdown).toContain("# Attest Evidence")
    expect(markdown).toContain("Verdict: PASS_WITH_WARNINGS")
    expect(markdown).toContain("What changed?")
  })
})
