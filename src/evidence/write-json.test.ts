import { describe, expect, it } from "bun:test"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDiffContext } from "../domain/diff-context"
import { createEvidenceRecord } from "../domain/evidence"
import { createRiskClassification } from "../domain/risk"
import { writeEvidenceJson } from "./write-json"

describe("writeEvidenceJson", () => {
  it("writes a JSON evidence artifact", () => {
    const directory = mkdtempSync(join(tmpdir(), "attest-json-"))
    const filePath = join(directory, "evidence.json")
    const record = createEvidenceRecord({
      sessionId: "ses_1",
      generatedAt: "2026-04-15T09:00:00.000Z",
      repoRoot: "/tmp/attest",
      diffContext: createDiffContext({
        mode: "working_tree",
        target: "working-tree",
        changedFiles: [{ path: "README.md", status: "modified", additions: 3, deletions: 0 }],
        truncated: false,
      }),
      intent: {
        summary: "Update docs",
        motivation: "Describe the flow",
        aiDisclosure: {
          used: false,
          contributionLevel: "none",
        },
      },
      risk: createRiskClassification({
        level: "low",
        categories: ["docs"],
        requiresHumanEscalation: false,
        rationale: ["Docs only"],
      }),
      questions: [],
      answers: [],
      ratings: [],
      verdict: "PASS",
      rationale: ["Looks good."],
      escalationFlags: [],
    })

    writeEvidenceJson(filePath, record)

    expect(JSON.parse(readFileSync(filePath, "utf8"))).toEqual(record)
  })
})
