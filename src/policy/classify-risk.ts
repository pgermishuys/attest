import type { DiffContext } from "../domain/diff-context"
import { createRiskClassification, type RiskCategory, type RiskClassification, type RiskLevel } from "../domain/risk"

const sensitivePatterns: Array<{ pattern: RegExp; category: RiskCategory }> = [
  { pattern: /(auth|oauth|permission|role|policy)/i, category: "auth_authz" },
  { pattern: /(token|jwt|credential)/i, category: "tokens" },
  { pattern: /(crypto|encrypt|decrypt|hash)/i, category: "crypto" },
  { pattern: /(secret|key|cert)/i, category: "secrets" },
  { pattern: /(billing|invoice|payment|ledger)/i, category: "billing" },
  { pattern: /(migration|schema|seed)/i, category: "migrations" },
  { pattern: /(deploy|infra|terraform|docker|k8s|workflow|ci)/i, category: "infrastructure" },
  { pattern: /(privacy|pii|gdpr|consent)/i, category: "privacy" },
]

const lowRiskPatterns: Array<{ pattern: RegExp; category: RiskCategory }> = [
  { pattern: /(^|\/)(readme|docs?)\b|\.md$/i, category: "docs" },
  { pattern: /(test|spec)\./i, category: "tests" },
]

const mediumRiskPatterns: Array<{ pattern: RegExp; category: RiskCategory }> = [
  { pattern: /(api|controller|endpoint|route)/i, category: "api_behavior" },
  { pattern: /(service|domain|handler|use-case|usecase|logic)/i, category: "business_logic" },
]

const hasLowRiskOnly = (categories: RiskCategory[]): boolean => categories.every((category) => category === "docs" || category === "tests")

export const classifyRisk = (diffContext: DiffContext): RiskClassification => {
  const categories = new Set<RiskCategory>()
  const rationale: string[] = []

  for (const file of diffContext.changedFiles) {
    for (const entry of sensitivePatterns) {
      if (entry.pattern.test(file.path)) categories.add(entry.category)
    }

    for (const entry of lowRiskPatterns) {
      if (entry.pattern.test(file.path)) categories.add(entry.category)
    }

    for (const entry of mediumRiskPatterns) {
      if (entry.pattern.test(file.path)) categories.add(entry.category)
    }
  }

  if (diffContext.changedFiles.length > 1) {
    categories.add("multi_file_feature")
    rationale.push("Multiple files changed.")
  }

  if (categories.size === 0) {
    categories.add("refactor")
    rationale.push("No explicit risk pattern matched; treating as refactor.")
  }

  let level: RiskLevel = "medium"
  if ([...categories].some((category) => ["auth_authz", "tokens", "crypto", "secrets", "billing", "migrations", "infrastructure", "privacy"].includes(category))) {
    level = "high"
    rationale.push("Sensitive category detected.")
  } else if (hasLowRiskOnly([...categories])) {
    level = "low"
    rationale.push("Only docs/tests patterns matched.")
  } else {
    rationale.push("Business logic or multi-file behavior detected.")
  }

  return createRiskClassification({
    level,
    categories: [...categories],
    requiresHumanEscalation: false,
    rationale,
  })
}
