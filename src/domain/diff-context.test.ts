import { describe, expect, it } from "bun:test"
import { createDiffContext, summarizeChangedFiles } from "./diff-context"

describe("diff context", () => {
  it("summarizes changed files deterministically", () => {
    const summary = summarizeChangedFiles([
      { path: "README.md", status: "modified", additions: 10, deletions: 2 },
      { path: "src/app.ts", status: "added", additions: 20, deletions: 0 },
    ])

    expect(summary).toEqual({
      filesChanged: 2,
      additions: 30,
      deletions: 2,
    })
  })

  it("derives summary when one is not provided", () => {
    const context = createDiffContext({
      mode: "staged",
      target: "HEAD",
      changedFiles: [{ path: "README.md", status: "modified", additions: 4, deletions: 1 }],
      truncated: false,
    })

    expect(context.summary).toEqual({
      filesChanged: 1,
      additions: 4,
      deletions: 1,
    })
  })
})
