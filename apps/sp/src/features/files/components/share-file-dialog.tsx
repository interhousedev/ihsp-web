"use client"

import {
  deleteFileShare,
  deleteFileShareLink,
  getFileSharesQuery,
  keys,
  postFileShareLink,
  putFileShare,
  type FileItem,
} from "@ihsp/api"
import { SharePanel } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"

/** Who may download the file: a link that requires sign-in, or named people. */
export function ShareFileDialog({ file, onClose }: { file: FileItem | null; onClose: () => void }) {
  const t = useT("files.sharing")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const id = file?.id ?? ""
  const shares = useQuery({ ...getFileSharesQuery(id), enabled: file !== null })
  const after =
    <T,>(call: () => Promise<T>) =>
    async () => {
      const result = await call()
      await client.invalidateQueries({ queryKey: keys.sharing.file(id) })
      return result
    }
  return (
    <ResponsiveDialog open={file !== null} onOpenChange={(open) => !open && onClose()} title={t("title")}>
      <SharePanel
        linkActive={shares.data?.link_active ?? false}
        people={shares.data?.people ?? []}
        linkFor={(token) => `${window.location.origin}/files/join/#${token}`}
        errorMessage={errorMessage}
        actions={{
          createLink: after(() => postFileShareLink(id)),
          deleteLink: after(() => deleteFileShareLink(id)),
          addPerson: (userId) => after(() => putFileShare(id, userId))(),
          removePerson: (userId) => after(() => deleteFileShare(id, userId))(),
        }}
      />
    </ResponsiveDialog>
  )
}
