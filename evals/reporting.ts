export type EvalRecord = {
  name: string
  passed: boolean
  details: string[]
}

export const renderEvalReport = (records: EvalRecord[]): string => {
  const lines = ["Attest behavioral evals"]

  for (const record of records) {
    lines.push(`- ${record.passed ? "PASS" : "FAIL"}: ${record.name}`)
    for (const detail of record.details) {
      lines.push(`  - ${detail}`)
    }
  }

  return `${lines.join("\n")}\n`
}
