import { describe, expect, it } from "bun:test"
import { ATTEST_COMMANDS } from "./definitions"

describe("ATTEST_COMMANDS", () => {
  it("has attest and attest-resume keys", () => {
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest")
    expect(Object.keys(ATTEST_COMMANDS)).toContain("attest-resume")
  })

  describe("attest command", () => {
    const cmd = ATTEST_COMMANDS["attest"]

    it("has name 'attest'", () => {
      expect(cmd.name).toBe("attest")
    })

    it("has a description mentioning comprehension interview", () => {
      expect(cmd.description).toContain("comprehension interview")
    })

    it("template contains $SESSION_ID placeholder", () => {
      expect(cmd.template).toContain("$SESSION_ID")
    })

    it("template contains $TIMESTAMP placeholder", () => {
      expect(cmd.template).toContain("$TIMESTAMP")
    })

    it("template contains $ARGUMENTS placeholder", () => {
      expect(cmd.template).toContain("$ARGUMENTS")
    })

    it("template contains <command-instruction> tags", () => {
      expect(cmd.template).toContain("<command-instruction>")
      expect(cmd.template).toContain("</command-instruction>")
    })

    it("template instructs LLM to call attest_submit tool", () => {
      expect(cmd.template).toContain("attest_submit")
    })

    it("template instructs LLM not to paraphrase answers", () => {
      expect(cmd.template.toLowerCase()).toContain("paraphrase")
    })

    it("has argumentHint", () => {
      expect(cmd.argumentHint).toBeDefined()
    })
  })

  describe("attest-resume command", () => {
    const cmd = ATTEST_COMMANDS["attest-resume"]

    it("has name 'attest-resume'", () => {
      expect(cmd.name).toBe("attest-resume")
    })

    it("has a description", () => {
      expect(typeof cmd.description).toBe("string")
      expect(cmd.description.length).toBeGreaterThan(0)
    })

    it("template contains $SESSION_ID placeholder", () => {
      expect(cmd.template).toContain("$SESSION_ID")
    })

    it("template contains $TIMESTAMP placeholder", () => {
      expect(cmd.template).toContain("$TIMESTAMP")
    })

    it("template contains $ARGUMENTS placeholder", () => {
      expect(cmd.template).toContain("$ARGUMENTS")
    })

    it("template contains <command-instruction> tags", () => {
      expect(cmd.template).toContain("<command-instruction>")
      expect(cmd.template).toContain("</command-instruction>")
    })

    it("template instructs LLM to call attest_submit tool", () => {
      expect(cmd.template).toContain("attest_submit")
    })

    it("template instructs LLM to submit only newly collected answers", () => {
      expect(cmd.template).toContain("only the newly collected answers")
      expect(cmd.template).toContain("already stored server-side")
    })
  })
})
