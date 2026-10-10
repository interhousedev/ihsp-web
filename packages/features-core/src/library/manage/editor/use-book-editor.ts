"use client"

import {
  getManageBookQuery,
  isApiError,
  keys,
  patchManageBook,
  postManageBook,
  postManageBookAction,
  postManageBookFile,
  type BookAction,
  type FileItem,
  type ItemFile,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { manageBookEditHref } from "../../utils/hrefs"
import { emptyForm, formFromInput, inputFromForm, sameForm, type BookForm } from "./book-form"
import { localChecklist, validateForm, type ChecklistItem } from "./book-form-checks"
import { useLeaveGuard } from "./use-leave-guard"

/** A book file uploaded before the book exists: attached right after the first save. */
export type PendingFile = { id: string; name: string; format: ItemFile["format"] }

export function formatOf(name: string): ItemFile["format"] {
  return name.toLowerCase().endsWith(".epub") ? "epub" : "pdf"
}

/**
 * State and actions of the book editor: the form, its baseline (for the dirty indicator and the leave guard), Save
 * (create or patch, with a queued file), the three actions (Publish, Unpublish, Take down) and the checklist.
 * A saved book is the server's `BookDraft`; a new book (`id === null`) starts from `initialTitle`.
 */
export function useBookEditor(id: string | null, initialTitle: string) {
  const t = useT("library.manage.editor")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const router = useRouter()
  const draftQuery = useQuery({ ...getManageBookQuery(id ?? ""), enabled: id !== null })
  const [form, setForm] = useState<BookForm>(() => emptyForm(initialTitle))
  const [baseline, setBaseline] = useState<BookForm>(() => emptyForm(initialTitle))
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [problem, setProblem] = useState<string | null>(null)

  const dirty = !sameForm(form, baseline) || pendingFile !== null
  useLeaveGuard(dirty, t("leaveConfirm"))

  // Load the saved book into the form, unless the librarian is in the middle of an edit.
  const loaded = useRef(0)
  useEffect(() => {
    const draft = draftQuery.data
    if (!draft || draftQuery.dataUpdatedAt === loaded.current || dirty) return
    loaded.current = draftQuery.dataUpdatedAt
    const next = formFromInput(draft.input, draft.item.cover_url)
    setForm(next)
    setBaseline(next)
  }, [draftQuery.data, draftQuery.dataUpdatedAt, dirty])

  const issues = useMemo(() => validateForm(form), [form])
  const blocked = Object.keys(issues).length > 0 || form.title.trim() === "" || form.authors.length === 0

  function update(patch: Partial<BookForm>) {
    setProblem(null)
    setMissing([])
    setForm((current) => ({ ...current, ...patch }))
  }

  const files = draftQuery.data?.item.files ?? []
  const primary = files.find((file) => file.is_primary) ?? files[0]
  const checklist: ChecklistItem[] = useMemo(() => {
    const server = draftQuery.data?.checklist
    const items =
      server && !dirty
        ? server
        : localChecklist(form, {
            present: pendingFile !== null || primary !== undefined,
            textOk: pendingFile !== null || primary?.text_status === "ready" || primary?.text_status === "no_text",
          })
    // The API's `422` names what failed even when the saved checklist looked fine.
    return items.map((item) => ({
      ...item,
      ok: item.ok && !missing.includes(item.key),
    }))
  }, [draftQuery.data?.checklist, dirty, form, pendingFile, primary, missing])

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: keys.library.manage.all() })
  }

  const save = useMutation({
    mutationFn: async () => {
      const input = inputFromForm(form)
      if (id) {
        await patchManageBook(id, input)
        return id
      }
      const created = await postManageBook(input)
      if (created.id && pendingFile) {
        await postManageBookFile(created.id, { file_id: pendingFile.id, format: pendingFile.format, is_primary: true })
      }
      return created.id
    },
    onSuccess: async (savedId) => {
      setBaseline(form)
      setPendingFile(null)
      setProblem(null)
      toast.success(t("saved"))
      await invalidate()
      if (!id && savedId) router.replace(manageBookEditHref(savedId))
    },
  })

  const attach = useMutation({
    mutationFn: (file: PendingFile) =>
      postManageBookFile(id!, { file_id: file.id, format: file.format, is_primary: true }),
    onSuccess: async () => {
      toast.success(t("fileAttached"))
      await invalidate()
    },
  })

  function addFile(file: FileItem) {
    const pending: PendingFile = { id: file.id, name: file.name, format: formatOf(file.name) }
    if (id) attach.mutate(pending)
    else setPendingFile(pending)
  }

  const act = useMutation({
    mutationFn: ({ action, reason }: { action: BookAction; reason?: string }) =>
      postManageBookAction(id!, action, reason ? { reason } : undefined),
    onSuccess: async (_item, { action }) => {
      setMissing([])
      setProblem(null)
      toast.success(t(`done.${action}`))
      await invalidate()
    },
    onError: (error) => {
      if (isApiError(error) && error.type === "library/rights-incomplete") {
        const list = error.params.missing
        setMissing(Array.isArray(list) ? list.map(String) : [])
        setProblem(null)
        void invalidate()
      } else {
        setProblem(errorMessage(error))
      }
    },
  })

  return {
    draft: draftQuery.data,
    loading: id !== null && draftQuery.isPending,
    loadError: draftQuery.error,
    refetch: draftQuery.refetch,
    form,
    update,
    dirty,
    issues,
    blocked,
    checklist,
    pendingFile,
    files,
    save,
    attach,
    addFile,
    act,
    problem,
  }
}
