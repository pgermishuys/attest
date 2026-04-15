import { describe, expect, it } from "bun:test"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { getSessionFilePath, sanitizeSessionId } from "../../../.opencode/plugins/attest/session/session-paths"

describe("session paths", () => {
  it("creates a deterministic session file path", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-session-paths-"))
    const filePath = getSessionFilePath(repoRoot, "ses_123")

    expect(filePath).toContain(join(".attest", "sessions", "ses_123.json"))
  })

  it("sanitizes session ids before building file paths", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "attest-session-paths-"))
    const filePath = getSessionFilePath(repoRoot, "../../bad session")

    expect(sanitizeSessionId("../../bad session")).toBe("bad_session")
    expect(filePath).toContain(join(".attest", "sessions", "bad_session.json"))
  })
})
