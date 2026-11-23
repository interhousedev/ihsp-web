import { describe, expect, it } from "bun:test"
import { embedUrl, videoSource } from "./interactive-video"
import { videoEmbed } from "./video"

// The video iframes run with allow-same-origin: their src must only ever be one of these two player hosts.
const PLAYER_HOSTS = new Set(["www.youtube-nocookie.com", "player.vimeo.com"])

const LINKS = [
  "https://youtu.be/dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://m.youtube.com/shorts/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://youtu.be/..%2F..%2Fevil.example%2F",
  "https://youtu.be/@evil.example",
  "https://www.youtube.com/watch?v=//evil.example/x",
  "https://vimeo.com/123456",
  "https://vimeo.com/channels/x/987654",
  "https://player.vimeo.com/video/42",
  "http://www.youtube-nocookie.com/embed/abcdefg",
]

describe("video embeds", () => {
  it("videoEmbed iframes only point at YouTube-nocookie or Vimeo", () => {
    for (const link of LINKS) {
      const embed = videoEmbed(link)
      if (embed.kind !== "iframe") continue
      const url = new URL(embed.src)
      expect(url.protocol).toBe("https:")
      expect(PLAYER_HOSTS.has(url.hostname)).toBe(true)
    }
  })

  it("embedUrl only points at YouTube-nocookie or Vimeo", () => {
    for (const link of LINKS) {
      const source = videoSource(link)
      if (source.kind !== "youtube" && source.kind !== "vimeo") continue
      const url = new URL(embedUrl(source, "https://lms.example"))
      expect(url.protocol).toBe("https:")
      expect(PLAYER_HOSTS.has(url.hostname)).toBe(true)
    }
  })

  it("never embeds same-origin or other hosts as an iframe", () => {
    for (const link of ["https://lms.example/v1/lms/html-widgets/x/index.html", "/relative", "javascript:alert(1)"]) {
      expect(videoEmbed(link).kind).not.toBe("iframe")
    }
  })
})
