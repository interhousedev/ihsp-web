"use client"

import { deleteManageCollection, getManageCollectionsQuery, keys, type ManageCollection } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, PageContainer, StateView } from "@ihsp/ui"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { CoverImage } from "../../catalog/cover-image"
import { pickLocalized } from "../shared/localized-fields"
import { CollectionDialog, type CollectionTarget } from "./collection-dialog"

/**
 * `/manage/collections/`: curated collections shown on the home page. Create and edit them (titles in Uzbek, Russian
 * and English, a published switch, a cover and the items picked by catalogue search), and delete them.
 */
export function CollectionsPage() {
  const t = useT("library.manage.collections")
  const errorMessage = useErrorMessage()
  const { locale } = useFormatters()
  const queryClient = useQueryClient()
  const list = useQuery(getManageCollectionsQuery())
  const [target, setTarget] = useState<CollectionTarget>(null)
  const [deleting, setDeleting] = useState<ManageCollection | null>(null)

  const remove = useMutation({
    mutationFn: (collection: ManageCollection) => deleteManageCollection(collection.id),
    onSuccess: async () => {
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })

  const add = (
    <Button type="button" className="min-h-11 md:min-h-8" onClick={() => setTarget("new")}>
      <IconPlus aria-hidden />
      {t("add")}
    </Button>
  )

  return (
    <PageContainer title={t("title")} description={t("description")} actions={add}>
      {list.isPending ? (
        <StateView state="loading" rows={3} />
      ) : list.isError ? (
        <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} action={add} />
      ) : (
        <ul aria-label={t("listLabel")} className="grid gap-3 md:grid-cols-2">
          {list.data.map((collection) => {
            const name = pickLocalized(collection.title, locale)
            return (
              <li key={collection.id} className="flex items-center gap-3 rounded-xl border p-3">
                <CoverImage src={collection.cover_url} className="aspect-[3/4] w-14 shrink-0 rounded-md" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-medium break-words">{name}</span>
                  <span className="text-muted-foreground text-xs">
                    {t("itemCount", { count: collection.item_ids.length })}
                  </span>
                  <span>
                    <Badge variant={collection.published ? "default" : "secondary"}>
                      {collection.published ? t("publishedBadge") : t("draftBadge")}
                    </Badge>
                  </span>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8"
                    aria-label={t("edit", { name })}
                    onClick={() => setTarget(collection)}
                  >
                    <IconPencil aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-11 md:size-8"
                    aria-label={t("delete", { name })}
                    onClick={() => setDeleting(collection)}
                  >
                    <IconTrash aria-hidden />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <CollectionDialog target={target} onClose={() => setTarget(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
          remove.reset()
        }}
        title={t("deleteTitle")}
        description={deleting ? t("deleteText", { name: pickLocalized(deleting.title, locale) }) : undefined}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting)
        }}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </PageContainer>
  )
}
