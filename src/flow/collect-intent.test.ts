import { describe, expect, it } from "bun:test"
import { collectIntent } from "./collect-intent"

describe("collectIntent", () => {
  it("normalizes a raw intent payload into a declared intent", () => {
    const intent = collectIntent({
      summary: "  Update plugin flow  ",
      motivation: "  Validate Attest  ",
      aiUsed: true,
      aiContributionLevel: "medium",
      aiNotes: "  Drafted initial copy  ",
    })

    expect(intent).toEqual({
      summary: "Update plugin flow",
      motivation: "Validate Attest",
      aiDisclosure: {
        used: true,
        contributionLevel: "medium",
        notes: "Drafted initial copy",
      },
    })
  })
})
