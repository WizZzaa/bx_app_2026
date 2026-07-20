export interface AnswerSource {
  label: string
  url: string
}

export function extractAnswerSources(content: string): AnswerSource[] {
  const sources: AnswerSource[] = []
  const seen = new Set<string>()
  for (const match of content.matchAll(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g)) {
    const [, label, url] = match
    if (seen.has(url)) continue
    seen.add(url)
    sources.push({ label: label.trim(), url })
  }
  return sources.slice(0, 5)
}

export function answerPreview(content: string, maxLength = 180): string {
  const plain = content
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*#>`_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  const nextBoundary = plain.indexOf(' ', maxLength)
  const end = nextBoundary > maxLength && nextBoundary <= maxLength + 20 ? nextBoundary : maxLength
  return `${plain.slice(0, end).trimEnd()}…`
}
