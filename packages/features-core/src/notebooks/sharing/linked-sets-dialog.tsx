"use client"

import { deleteLinkedSet, getLinkedSetsQuery, getSharedNotebooksQuery, keys, postLinkedSet } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconTrash, ResponsiveDialog } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

type Props = { notebookId: string; open: boolean; onOpenChange: (open: boolean) => void }

/** Notebooks shared with the student, attached as base materials: their current sources feed this notebook's chat. */
export function LinkedSetsDialog({ notebookId, open, onOpenChange }: Props) {
  const t = useT("notebooks.share")
  const errorMessage = useNotebookErrorMessage()
  const client = useQueryClient()
  const sets = useQuery({ ...getLinkedSetsQuery(notebookId), enabled: open })
  const shared = useQuery({ ...getSharedNotebooksQuery(), enabled: open })
  const refresh = () => client.invalidateQueries({ queryKey: keys.sharing.linkedSets(notebookId) })
  const attach = useMutation({ mutationFn: (id: string) => postLinkedSet(notebookId, id), onSuccess: refresh })
  const detach = useMutation({ mutationFn: (id: string) => deleteLinkedSet(notebookId, id), onSuccess: refresh })
  const attached = new Set(sets.data?.items.map((set) => set.notebook_id))
  const candidates = shared.data?.items.filter((notebook) => !attached.has(notebook.id)) ?? []
  const failure = attach.error ?? detach.error
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="sm" title={t("setsTitle")}>
      <ul className="flex flex-col gap-1">
        {sets.data?.items.map((set) => (
          <li key={set.notebook_id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm">
              {set.available ? `${set.title ?? ""} (${t("setSources", { count: set.sources.length })})` : t("setGone")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              aria-label={t("detach")}
              onClick={() => detach.mutate(set.notebook_id)}
            >
              <IconTrash aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {candidates.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {candidates.map((notebook) => (
            <li key={notebook.id}>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-start md:min-h-8"
                onClick={() => attach.mutate(notebook.id)}
              >
                {t("attach", { title: notebook.title })}
              </Button>
            </li>
          ))}
        </ul>
      ) : sets.data?.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noSets")}</p>
      ) : null}
      {failure ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(failure)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
