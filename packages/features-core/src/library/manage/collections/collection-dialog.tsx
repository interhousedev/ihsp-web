"use client"

import {
  getLibraryCollectionQuery,
  keys,
  patchManageCollection,
  postManageCollection,
  type ItemCard,
  type ManageCollection,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Switch,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { CoverImage } from "../../catalog/cover-image"
import { FileUploadButton } from "../../../file-upload-button"
import { emptyLocalized, LocalizedFields, type Localized } from "../shared/localized-fields"
import { ItemPicker } from "./item-picker"

/** `"new"` starts a collection, a `ManageCollection` edits one, `null` keeps the dialog closed. */
export type CollectionTarget = ManageCollection | "new" | null

type Form = {
  title: Localized
  description: Localized
  published: boolean
  coverFileId: string | null
  coverUrl: string | null
  coverName: string | null
  items: ItemCard[]
}

const emptyForm = (): Form => ({
  title: emptyLocalized(),
  description: emptyLocalized(),
  published: false,
  coverFileId: null,
  coverUrl: null,
  coverName: null,
  items: [],
})

/** Create or edit a collection: titles in three languages, description, published switch, cover and its items. */
export function CollectionDialog({ target, onClose }: { target: CollectionTarget; onClose: () => void }) {
  const t = useT("library.manage.collections")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const id = useId()
  const existing = target && target !== "new" ? target : null
  const detail = useQuery({ ...getLibraryCollectionQuery(existing?.id ?? ""), enabled: existing !== null })
  const [form, setForm] = useState<Form>(emptyForm())
  const [attempted, setAttempted] = useState(false)

  // Fill the form when the dialog opens; the items of an existing collection arrive with its detail.
  useEffect(() => {
    setAttempted(false)
    if (!existing) {
      setForm(emptyForm())
      return
    }
    setForm({
      title: existing.title,
      description: existing.description ?? emptyLocalized(),
      published: existing.published,
      coverFileId: null,
      coverUrl: existing.cover_url,
      coverName: null,
      items: [],
    })
  }, [existing])
  useEffect(() => {
    if (detail.data) setForm((current) => ({ ...current, items: detail.data.items }))
  }, [detail.data])

  const save = useMutation({
    mutationFn: () => {
      const hasDescription = Object.values(form.description).some((text) => text.trim() !== "")
      const body = {
        title: form.title,
        description: hasDescription ? form.description : null,
        published: form.published,
        item_ids: form.items.flatMap((card) => (card.id ? [card.id] : [])),
        ...(form.coverFileId ? { cover_file_id: form.coverFileId } : {}),
      }
      return existing ? patchManageCollection(existing.id, body) : postManageCollection(body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.library.all() })
      onClose()
    },
  })

  const complete = Object.values(form.title).every((text) => text.trim() !== "")
  const loadingItems = existing !== null && detail.isPending

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogHint")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            setAttempted(true)
            if (complete && !loadingItems && !save.isPending) save.mutate()
          }}
        >
          <LocalizedFields
            label={t("titleField")}
            required
            values={form.title}
            showErrors={attempted}
            onChange={(title) => setForm((current) => ({ ...current, title }))}
          />
          <LocalizedFields
            label={t("descriptionField")}
            multiline
            values={form.description}
            onChange={(description) => setForm((current) => ({ ...current, description }))}
          />
          <div className="flex min-h-11 items-center justify-between gap-3">
            <div className="min-w-0">
              <p id={`${id}-published`} className="text-sm font-medium">
                {t("published")}
              </p>
              <p className="text-muted-foreground text-xs">{t("publishedHint")}</p>
            </div>
            <Switch
              checked={form.published}
              aria-labelledby={`${id}-published`}
              onCheckedChange={(published) => setForm((current) => ({ ...current, published }))}
            />
          </div>
          <div className="flex items-start gap-3">
            <CoverImage src={form.coverUrl} className="aspect-[3/4] w-20 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium">{t("cover")}</p>
              <FileUploadButton
                purpose="library_cover"
                accept=".jpg,.jpeg,.png,.webp"
                label={form.coverUrl || form.coverFileId ? t("coverReplace") : t("coverChoose")}
                onUploaded={(file) =>
                  setForm((current) => ({ ...current, coverFileId: file.id, coverUrl: null, coverName: file.name }))
                }
              />
              {form.coverName ? <p className="text-sm">{t("coverNew", { name: form.coverName })}</p> : null}
            </div>
          </div>
          {loadingItems ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <ItemPicker selected={form.items} onChange={(items) => setForm((current) => ({ ...current, items }))} />
          )}
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={save.isPending || loadingItems}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
