"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useCreateKbArticle, useUpdateKbArticle, type KbArticle } from "../api"

export const KB_LOCALES = ["uz", "ru", "en"] as const

interface Draft {
  title: string
  body: string
  locale: string
  tags: string
  published: boolean
}

const EMPTY: Draft = { title: "", body: "", locale: "ru", tags: "", published: false }

function toDraft(article: KbArticle | null): Draft {
  if (!article) return EMPTY
  return {
    title: article.title,
    body: article.body,
    locale: article.locale,
    tags: article.tags.join(", "),
    published: article.status === "published",
  }
}

export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ]
}

/** Creates an article, or edits `article` when given. */
export function ArticleFormDialog({
  open,
  article,
  onOpenChange,
}: {
  open: boolean
  article: KbArticle | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("kb.staff")
  const errorMessage = useErrorMessage()
  const create = useCreateKbArticle()
  const update = useUpdateKbArticle()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  useEffect(() => {
    if (open) setDraft(toDraft(article))
  }, [open, article])
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const done = {
    onSuccess: () => {
      toast.success(t("saved"))
      onOpenChange(false)
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  }
  const submit = () => {
    const fields = {
      title: draft.title.trim(),
      body: draft.body,
      locale: draft.locale,
      tags: parseTags(draft.tags),
      status: draft.published ? ("published" as const) : ("draft" as const),
    }
    if (article) update.mutate({ id: article.id, patch: fields }, done)
    else create.mutate(fields, done)
  }
  const pending = create.isPending || update.isPending

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={article ? t("edit") : t("new")}
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !draft.title.trim() || !draft.body.trim()}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          {t("fieldTitle")}
          <Input value={draft.title} maxLength={200} onChange={(event) => set("title", event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {t("body")}
          <Textarea value={draft.body} rows={10} onChange={(event) => set("body", event.target.value)} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("locale")}
            <select
              value={draft.locale}
              onChange={(event) => set("locale", event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              {KB_LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {locale.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("tags")}
            <Input value={draft.tags} onChange={(event) => set("tags", event.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) => set("published", event.target.checked)}
            className="size-4"
          />
          {t("published")}
        </label>
      </div>
    </ResponsiveDialog>
  )
}
