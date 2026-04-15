import { describe, expect, it } from "bun:test"
import { createDiffContext } from "../domain/diff-context"
import { classifyRisk } from "./classify-risk"

describe("classifyRisk", () => {
  it("treats docs-only changes as low risk", () => {
    const risk = classifyRisk(
      createDiffContext({
        mode: "staged",
        target: "staged",
        changedFiles: [{ path: "README.md", status: "modified", additions: 4, deletions: 1 }],
        truncated: false,
      }),
    )

    expect(risk.level).toBe("low")
    expect(risk.categories).toContain("docs")
  })

  it("escalates sensitive auth paths to high risk", () => {
    const risk = classifyRisk(
      createDiffContext({
        mode: "staged",
        target: "staged",
        changedFiles: [{ path: "src/auth/policy.ts", status: "modified", additions: 10, deletions: 2 }],
        truncated: false,
      }),
    )

    expect(risk.level).toBe("high")
    expect(risk.requiresHumanEscalation).toBe(true)
  })
})
