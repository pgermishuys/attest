import { resolve, sep } from "node:path"

const normalizeRoot = (root: string): string => resolve(root)

export const resolvePathInsideRoot = (root: string, relativePath: string, label: string): string => {
  const normalizedRoot = normalizeRoot(root)
  const resolvedPath = resolve(normalizedRoot, relativePath)
  if (resolvedPath === normalizedRoot || resolvedPath.startsWith(`${normalizedRoot}${sep}`)) {
    return resolvedPath
  }

  throw new Error(`${label} must stay within the repository root.`)
}

export const sanitizePathSegment = (value: string, label: string): string => {
  const sanitized = value.trim().replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "")
  if (!sanitized) {
    throw new Error(`${label} must contain at least one letter or number.`)
  }

  return sanitized
}
