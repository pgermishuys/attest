import { describe, expect, it } from "bun:test"
import { truncateDiff } from "./truncate-diff"

describe("truncateDiff", () => {
  it("returns the full diff when it is under the limit", () => {
    const result = truncateDiff("small diff", 50)

    expect(result).toEqual({
      text: "small diff",
      truncated: false,
      originalLength: 10,
    })
  })

  it("truncates oversized diffs deterministically", () => {
    const result = truncateDiff("abcdefghijklmnopqrstuvwxyz", 20)

    expect(result.truncated).toBe(true)
    expect(result.originalLength).toBe(26)
    expect(result.text).toContain("[... diff truncated by Attest ...]")
    expect(result.text.length).toBe(36)
  })
})
