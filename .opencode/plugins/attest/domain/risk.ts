export const RiskLevels = ["low", "medium", "high"] as const
export type RiskLevel = (typeof RiskLevels)[number]

export const RiskCategories = [
  "docs",
  "tests",
  "refactor",
  "business_logic",
  "api_behavior",
  "multi_file_feature",
  "auth_authz",
  "tokens",
  "crypto",
  "secrets",
  "billing",
  "migrations",
  "infrastructure",
  "privacy",
] as const

export type RiskCategory = (typeof RiskCategories)[number]

export const SensitiveRiskCategories: readonly RiskCategory[] = [
  "auth_authz",
  "tokens",
  "crypto",
  "secrets",
  "billing",
  "migrations",
  "infrastructure",
  "privacy",
]

export type RiskClassification = {
  level: RiskLevel
  categories: RiskCategory[]
  requiresHumanEscalation: boolean
  rationale: string[]
}

export const createRiskClassification = (input: RiskClassification): RiskClassification => {
  const categories = [...new Set(input.categories)].sort()
  const requiresHumanEscalation = categories.some((category) => SensitiveRiskCategories.includes(category))

  return {
    ...input,
    categories,
    requiresHumanEscalation: input.requiresHumanEscalation || requiresHumanEscalation,
  }
}
