"use client"

import {
  getArtifactsQuery,
  getNotebooksQuery,
  keys,
  postArtifactAttachToLesson,
  type AttachedResource,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, NativeSelect, NativeSelectOption, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"

/** Studio outputs that are files (report .docx, table .xlsx, slides .pptx): the ones the backend can attach. */
const ATTACHABLE = new Set(["report", "data_table", "slides"])

/**
 * "From notebook" source of the add-material dialog: pick a notebook, then one of its ready Studio outputs, and it is
 * attached through `POST /v1/notebooks/{id}/artifacts/{aid}/attach-to-lesson` with the chosen role.
 */
export function NotebookSource({
  lessonId,
  role,
  onAttached,
}: {
  lessonId: string
  role: "material" | "attachment"
  onAttached: () => void
}) {
  const t = useT("lessonDetail.add.notebook")
  const errorMessage = useErrorMessage()
  const id = useId()
  const queryClient = useQueryClient()
  const [picked, setPicked] = useState("")
  const notebooks = useQuery(getNotebooksQuery({ limit: 50 }))
  const items = notebooks.data?.items ?? []
  const notebookId = picked || items[0]?.id || ""
  const artifacts = useQuery({ ...getArtifactsQuery(notebookId, { status: "ready" }), enabled: notebookId !== "" })
  const files = (artifacts.data ?? []).filter((item) => item.status === "ready" && ATTACHABLE.has(item.kind))
  const attach = useMutation<AttachedResource, unknown, string>({
    mutationFn: (artifactId) => postArtifactAttachToLesson(notebookId, artifactId, { lesson_id: lessonId, role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.staff.lesson(lessonId) })
      onAttached()
    },
  })

  if (notebooks.isPending) return <StateView state="loading" rows={2} />
  if (items.length === 0) return <StateView state="empty" emptyText={t("noNotebooks")} />

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="text-sm font-medium">
        {t("pick")}
      </label>
      <NativeSelect
        id={id}
        className="w-full [&_select]:h-11 md:[&_select]:h-8"
        value={notebookId}
        onChange={(event) => setPicked(event.target.value)}
      >
        {items.map((item) => (
          <NativeSelectOption key={item.id} value={item.id}>
            {item.emoji ? `${item.emoji} ` : ""}
            {item.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {artifacts.isPending && notebookId !== "" ? <StateView state="loading" rows={2} /> : null}
      {!artifacts.isPending && files.length === 0 ? <StateView state="empty" emptyText={t("none")} /> : null}
      <ul className="flex flex-col gap-1.5" data-testid="notebook-outputs">
        {files.map((item) => (
          <li key={item.id}>
            <Button
              variant="outline"
              className="min-h-11 w-full justify-start truncate md:min-h-8"
              disabled={attach.isPending}
              onClick={() => attach.mutate(item.id)}
            >
              {item.title}
            </Button>
          </li>
        ))}
      </ul>
      {attach.isError ? <p role="alert" className="text-destructive text-sm">{errorMessage(attach.error)}</p> : null}
    </div>
  )
}
