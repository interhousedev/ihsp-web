"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { RichTextEditor } from "@ihsp/features-core/rich-text"
import { kbLibrary, MessageWithOpenUi, safeLinkUrl } from "@ihsp/features-core/openui"
import { Button, Input, Markdown, ResponsiveDialog, TagInput } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCreateKbArticle, useUpdateKbArticle, type KbArticle } from "../api"
import { bodyBlocks, MAX_BLOCKS } from "../openui-source"
import { InsertBlockMenu } from "./insert-block-menu"
import { OpenUiBlockNode } from "./open-ui-block-node"

const EXTENSIONS = [OpenUiBlockNode]

export const KB_LOCALES = ["uz", "ru", "en"] as const

interface Draft {
  title: string
  body: string
  locale: string
  tags: string[]
  published: boolean
}

const EMPTY: Draft = {
  title: "",
  body: "",
  locale: "ru",
  tags: [],
  published: false,
}

function toDraft(article: KbArticle | null): Draft {
  if (!article) return EMPTY
  return {
    title: article.title,
    body: article.body,
    locale: article.locale,
    tags: [...article.tags],
    published: article.status === "published",
  }
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
  const u = useT("settingsUx")
  const errorMessage = useErrorMessage()
  const create = useCreateKbArticle()
  const update = useUpdateKbArticle()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [serverError, setServerError] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      setDraft(toDraft(article))
      setServerError(null)
    }
  }, [open, article])
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const done = {
    onSuccess: () => {
      toast.success(t("saved"))
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      // The 422 `admission/kb_body_invalid` explains which block or link is wrong; it stays under the editor.
      setServerError(errorMessage(error))
      toast.error(errorMessage(error))
    },
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setServerError(null)
    const fields = {
      title: draft.title.trim(),
      body: draft.body,
      locale: draft.locale,
      tags: draft.tags,
      status: draft.published ? ("published" as const) : ("draft" as const),
    }
    if (article) update.mutate({ id: article.id, patch: fields }, done)
    else create.mutate(fields, done)
  }
  const pending = create.isPending || update.isPending
  const blocks = bodyBlocks(draft.body)
  const bodyOk = blocks.count <= MAX_BLOCKS && !blocks.tooLong

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
          <Button type="submit" disabled={pending || !draft.title.trim() || !draft.body.trim() || !bodyOk}>
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
        <div className="flex flex-col gap-2 text-sm font-medium">
          <span id="kb-body-label">{t("body")}</span>
          <RichTextEditor
            value={draft.body}
            onChange={(body) => set("body", body)}
            ariaLabel={t("body")}
            extensions={EXTENSIONS}
            invalid={!bodyOk || serverError !== null}
            toolbarExtra={<InsertBlockMenu body={draft.body} onBody={(body) => set("body", body)} />}
            renderPreview={(markdown) => (
              <MessageWithOpenUi
                text={markdown}
                library={kbLibrary}
                links="kb"
                renderMarkdown={(part) => (
                  <Markdown allowLink={(href) => safeLinkUrl(href, "kb") !== null}>{part}</Markdown>
                )}
              />
            )}
          />
          {!bodyOk ? (
            <p role="alert" className="text-destructive text-xs font-normal">
              {t("block.tooMany", { max: MAX_BLOCKS })}
            </p>
          ) : null}
          {serverError ? (
            <p role="alert" className="text-destructive text-xs font-normal">
              {serverError}
            </p>
          ) : null}
        </div>
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
            <TagInput
              value={draft.tags}
              onChange={(tags) => set("tags", tags)}
              max={12}
              maxLength={40}
              placeholder={u("tagsPlaceholder")}
              removeLabel={(tag) => u("removeTag", { tag })}
            />
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
