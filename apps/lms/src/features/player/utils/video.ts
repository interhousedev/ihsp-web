export type VideoEmbed = { kind: "iframe"; src: string } | { kind: "file"; src: string } | { kind: "none" }

/** Turns a pasted link into something the player can show: YouTube and Vimeo embeds, or a direct file. */
export function videoEmbed(url: string): VideoEmbed {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { kind: "none" }
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { kind: "none" }
  const host = parsed.hostname.replace(/^www\./, "")
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1)
    return id
      ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` }
      : { kind: "none" }
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
    return id
      ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` }
      : { kind: "none" }
  }
  if (host === "vimeo.com") {
    const id = parsed.pathname.match(/\/(\d+)/)?.[1]
    return id ? { kind: "iframe", src: `https://player.vimeo.com/video/${id}` } : { kind: "none" }
  }
  return { kind: "file", src: parsed.toString() }
}
