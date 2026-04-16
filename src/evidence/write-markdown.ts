import { writeFileSync } from "node:fs"
import type { EvidenceRecord } from "../domain/evidence"

const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join("\n")

export const renderEvidenceMarkdown = (record: EvidenceRecord): string => {
  return `# Attest Evidence\n\n## Verdict\n\n- Verdict: ${record.verdict}\n- Generated: ${record.generatedAt}\n- Session: ${record.sessionId}\n\n## Intent\n\n- Summary: ${record.intent.summary}\n- Motivation: ${record.intent.motivation}\n- AI Used: ${record.intent.aiDisclosure.used ? "yes" : "no"}\n- AI Contribution: ${record.intent.aiDisclosure.contributionLevel}\n\n## Diff\n\n- Target: ${record.diffContext.target}\n- Mode: ${record.diffContext.mode}\n- Files changed: ${record.diffContext.summary.filesChanged}\n- Additions: ${record.diffContext.summary.additions}\n- Deletions: ${record.diffContext.summary.deletions}\n\n## Rationale\n\n${bullets(record.rationale)}\n\n## Questions\n\n${record.questions
    .map((question) => {
      const answer = record.answers.find((item) => item.questionId === question.id)
      return `### ${question.id}\n\n- Prompt: ${question.prompt}\n- Answer: ${answer?.answer ?? "(not answered)"}`
    })
    .join("\n\n")}\n`
}

export const writeEvidenceMarkdown = (filePath: string, record: EvidenceRecord): void => {
  writeFileSync(filePath, renderEvidenceMarkdown(record), "utf8")
}
