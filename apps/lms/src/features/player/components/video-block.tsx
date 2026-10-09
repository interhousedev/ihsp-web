"use client"

import { useT } from "@ihsp/i18n"
import { videoEmbed } from "../utils/video"

/** A video step: an embed for YouTube / Vimeo links, a native player for direct files. */
export function VideoBlock({ url, caption }: { url: string; caption: string }) {
  const t = useT("player")
  const embed = videoEmbed(url)
  return (
    <figure className="flex flex-col gap-2">
      {embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={caption || t("video")}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full rounded-lg border"
        />
      ) : embed.kind === "file" ? (
        <video
          src={embed.src}
          controls
          preload="metadata"
          aria-label={caption || t("video")}
          className="aspect-video w-full rounded-lg border bg-black"
        >
          <track kind="captions" />
        </video>
      ) : (
        <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
      )}
      {caption ? <figcaption className="text-muted-foreground text-sm">{caption}</figcaption> : null}
    </figure>
  )
}
