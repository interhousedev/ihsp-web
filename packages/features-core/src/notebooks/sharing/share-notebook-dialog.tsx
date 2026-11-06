"use client"

import {
  deleteNotebookShare,
  deleteNotebookShareLink,
  getNotebookSharesQuery,
  keys,
  postNotebookShareLink,
  putNotebookShare,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { SharePanel } from "./share-panel"

type Props = { notebookId: string; open: boolean; onOpenChange: (open: boolean) => void }

/** Who may open the notebook. Recipients read current sources and chat privately on their own limits. */
export function ShareNotebookDialog({ notebookId, open, onOpenChange }: Props) {
  const t = useT("notebooks.share")
  const errorMessage = useNotebookErrorMessage()
  const client = useQueryClient()
  const shares = useQuery({ ...getNotebookSharesQuery(notebookId), enabled: open })
  const after =
    <T,>(call: () => Promise<T>) =>
    async () => {
      const result = await call()
      await client.invalidateQueries({ queryKey: keys.sharing.notebook(notebookId) })
      return result
    }
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="sm" title={t("title")}>
      <SharePanel
        linkActive={shares.data?.link_active ?? false}
        people={shares.data?.people ?? []}
        linkFor={(token) => `${window.location.origin}/notebooks/join/#${token}`}
        errorMessage={errorMessage}
        actions={{
          createLink: after(() => postNotebookShareLink(notebookId)),
          deleteLink: after(() => deleteNotebookShareLink(notebookId)),
          addPerson: (userId) => after(() => putNotebookShare(notebookId, userId))(),
          removePerson: (userId) => after(() => deleteNotebookShare(notebookId, userId))(),
        }}
      />
      {shares.data && shares.data.hidden_source_kinds.length > 0 ? (
        <p className="text-muted-foreground text-sm">{t("hiddenSources")}</p>
      ) : null}
    </ResponsiveDialog>
  )
}
