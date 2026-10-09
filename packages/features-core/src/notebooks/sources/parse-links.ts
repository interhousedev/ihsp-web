export type ParsedLinks = {
  /** Distinct `http(s)` addresses in the order they were typed. */
  urls: string[]
  /** Pieces that are not web addresses (shown as a hint, never sent). */
  skipped: string[]
}

function isWebAddress(piece: string): boolean {
  try {
    const url = new URL(piece)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/** Splits the Link tab text on spaces and line breaks (NotebookLM accepts several URLs at once). */
export function parseLinks(text: string): ParsedLinks {
  const urls: string[] = []
  const skipped: string[] = []
  for (const piece of text.split(/[\s,;]+/).filter(Boolean)) {
    if (!isWebAddress(piece)) skipped.push(piece)
    else if (!urls.includes(piece)) urls.push(piece)
  }
  return { urls, skipped }
}
