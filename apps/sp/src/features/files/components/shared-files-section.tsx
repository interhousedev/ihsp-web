"use client"

import { deleteSharedFile, getSharedFilesQuery, getSharedFileUrl, keys } from "@ihsp/api"
import { FileDownloadButton, FileItem } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, IconTrash } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/** "Shared with me" on the files page; absent while nothing is shared. */
export function SharedFilesSection() {
  const t = useT("files.sharing")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const shared = useQuery(getSharedFilesQuery())
  const items = shared.data?.items ?? []
  if (items.length === 0) return null

  async function leave(id: string) {
    try {
      await deleteSharedFile(id)
      await client.invalidateQueries({ queryKey: keys.sharing.files() })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("sharedTitle")}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((file) => (
          <FileItem
            as="li"
            key={file.id}
            name={file.name}
            meta={[t("from", { name: file.owner_name })]}
            actions={
              <>
                <FileDownloadButton
                  resolve={() => getSharedFileUrl(file.id).then(({ url }) => url)}
                  errorText={errorMessage}
                  onError={() => void client.invalidateQueries({ queryKey: keys.sharing.files() })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 md:size-8"
                  aria-label={t("remove")}
                  onClick={() => void leave(file.id)}
                >
                  <IconTrash aria-hidden />
                </Button>
              </>
            }
          />
        ))}
      </ul>
    </section>
  )
}
