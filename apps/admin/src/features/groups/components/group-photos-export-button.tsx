"use client"

import { getAdminGroupPhotosZip } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Icons, LoadingButton } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { downloadBlob } from "../../shared/utils/csv"

const RESERVED_IN_NAMES = '\\/:*?"<>|'

/** Download name without path separators, reserved or control characters. */
function zipName(groupName: string) {
  const clean = [...groupName]
    .map((ch) => (ch.charCodeAt(0) < 32 || RESERVED_IN_NAMES.includes(ch) ? " " : ch))
    .join("")
    .trim()
  return `${clean || "group"} photos.zip`
}

/**
 * Downloads the photos of the group's active students as one ZIP (ADM-PHOTO-2). The archive names each file after the
 * student and lists the students without a photo in `manifest.txt`.
 */
export function GroupPhotosExportButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const t = useT("groups")
  const errorMessage = useErrorMessage()
  const [pending, setPending] = useState(false)

  async function run() {
    setPending(true)
    try {
      downloadBlob(await getAdminGroupPhotosZip(groupId), zipName(groupName))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      className="min-h-11 md:min-h-8"
      loading={pending}
      loadingLabel={t("view.exportingPhotos")}
      onClick={() => void run()}
    >
      <Icons.upload aria-hidden />
      {t("view.exportPhotos")}
    </LoadingButton>
  )
}
