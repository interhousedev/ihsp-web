"use client"

import { keys, patchMaterial, type ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useLibraryAccess } from "../hooks/use-library-access"
import { itemHref, myHref } from "../utils/hrefs"
import { DetailsFields } from "./details-fields"
import { kindOfItem, valuesFromItem, type MaterialValues } from "./material-values"
import { MarkdownEditor } from "./markdown-editor"
import { UploadReviewNote } from "./upload-review-note"
import { limitsFor } from "./upload-config"
import { UploadProblem } from "./upload-problem"

/**
 * Edits a material that is already with the librarians or published: title, description, topics and, for a note, its
 * text (the owner may change these at any time, § 3.5). Subjects, years, type and language stay as they were.
 * Replacing the file is not offered here.
 */
export function MaterialDetailsEditor({ item, initialBody = "" }: { item: ItemDetail; initialBody?: string }) {
  const t = useT("library.upload.edit")
  const itemT = useT("library.item")
  const access = useLibraryAccess()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<MaterialValues>(() => valuesFromItem(item, initialBody))
  const [showProblem, setShowProblem] = useState(false)
  const markdown = kindOfItem(item) === "markdown"

  const save = useMutation({
    mutationFn: () =>
      patchMaterial(item.id!, {
        title: values.title.trim(),
        description: values.description.trim(),
        topic_ids: values.topicIds,
        ...(markdown ? { body_md: values.body } : {}),
      }),
    onSuccess: () => {
      toast.success(t("saved"))
      void queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })

  const titleMissing = values.title.trim() === ""
  const bodyMissing = markdown && values.body.trim() === ""
  const patch = (change: Partial<MaterialValues>) => setValues((current) => ({ ...current, ...change }))

  return (
    <form
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        setShowProblem(true)
        if (!titleMissing && !bodyMissing) save.mutate()
      }}
    >
      <p className="bg-muted/40 rounded-xl border p-3 text-sm">
        {t("statusNote", { status: itemT(`status.${item.status}`) })}
      </p>
      <UploadReviewNote reason={item.status_reason} message={item.status_note} />
      <DetailsFields values={values} onChange={patch} showProblems={showProblem} readOnlyMeta />
      {markdown ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{t("body")}</h3>
          <MarkdownEditor
            value={values.body}
            onChange={(body) => patch({ body })}
            label={t("body")}
            invalid={showProblem && bodyMissing}
          />
        </div>
      ) : null}
      {save.isError ? <UploadProblem error={save.error} limits={limitsFor(access.publishesDirectly)} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={myHref("uploads")} className={buttonVariants({ variant: "ghost", className: "min-h-11" })}>
          {t("cancel")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {item.status === "published" && item.id ? (
            <Link href={itemHref(item.id)} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
              {t("view")}
            </Link>
          ) : null}
          <Button type="submit" className="min-h-11" disabled={save.isPending}>
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </form>
  )
}
