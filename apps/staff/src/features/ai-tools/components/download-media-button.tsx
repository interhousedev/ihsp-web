"use client"

import { getFileUrl } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconDownload } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"

/** Downloads the finished file: an .mp4 for a video, the audio file for a voice-over. */
export function DownloadMediaButton({ fileId, video }: { fileId: string; video: boolean }) {
  const t = useT("aiTools")
  const download = useMutation({
    mutationFn: async () => {
      const { url } = await getFileUrl(fileId, { disposition: "attachment" })
      window.location.assign(url)
    },
  })
  return (
    <Button type="button" className="self-start" disabled={download.isPending} onClick={() => download.mutate()}>
      <IconDownload aria-hidden />
      {video ? t("studio.result.downloadVideo") : t("studio.result.downloadAudio")}
    </Button>
  )
}
