export type TruncatedDiff = {
  text: string
  truncated: boolean
  originalLength: number
}

export const truncateDiff = (diffText: string, maxCharacters: number): TruncatedDiff => {
  if (diffText.length <= maxCharacters) {
    return {
      text: diffText,
      truncated: false,
      originalLength: diffText.length,
    }
  }

  const marker = "\n\n[... diff truncated by Attest ...]"
  const sliceLength = Math.max(0, maxCharacters - marker.length)

  return {
    text: `${diffText.slice(0, sliceLength)}${marker}`,
    truncated: true,
    originalLength: diffText.length,
  }
}
