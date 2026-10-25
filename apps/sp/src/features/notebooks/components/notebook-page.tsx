"use client"

import { postNotebookAutoSubject } from "@ihsp/api"
import { NotebookWorkspace, WorkspaceNotFound } from "@ihsp/features-core"
import { useErrorMessage } from "@ihsp/i18n"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * `/notebooks/view/?id=`: the workspace of one notebook (static export, so the id is a query parameter).
 * `?subject=` (optionally `&group=`) opens the subject notebook, creating it on first open; next to an `id` that is
 * gone (a stale link) it is the fallback.
 */
export function NotebookPage() {
  const params = useSearchParams()
  const id = params.get("id")
  const subject = params.get("subject")
  const recover = subject ? <OpenSubjectNotebook subjectId={subject} groupId={params.get("group")} /> : null
  if (!id) return recover ?? <WorkspaceNotFound />
  return <NotebookWorkspace notebookId={id} {...(recover ? { notFound: recover } : {})} />
}

/** Create-or-get the subject notebook, then replace the address with its id (other parameters such as `lesson` stay). */
function OpenSubjectNotebook({ subjectId, groupId }: { subjectId: string; groupId: string | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const errorMessage = useErrorMessage()
  const open = useMutation({ mutationFn: () => postNotebookAutoSubject(subjectId, { group_id: groupId }) })
  const started = useRef("")
  const { mutate } = open

  useEffect(() => {
    const key = `${subjectId}:${groupId ?? ""}`
    if (started.current === key) return
    started.current = key
    mutate()
  }, [mutate, subjectId, groupId])

  useEffect(() => {
    if (!open.data) return
    const rest = new URLSearchParams(params.toString())
    for (const name of ["id", "subject", "group"]) rest.delete(name)
    const tail = rest.toString()
    router.replace(`/notebooks/view/?id=${encodeURIComponent(open.data.id)}${tail ? `&${tail}` : ""}`)
  }, [open.data, params, router])

  if (!open.isError) return null
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 p-4">
      <p role="alert" className="text-destructive text-sm">
        {errorMessage(open.error)}
      </p>
      <WorkspaceNotFound />
    </div>
  )
}
