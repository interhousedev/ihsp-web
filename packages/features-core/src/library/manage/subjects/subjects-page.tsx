"use client"

import { getManageSubjectsQuery, keys, patchManageSubject, type ManageSubject } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { IconPlus } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { buildTree, reorderPatches } from "../shared/tree"
import { SubjectDialog, type SubjectTarget } from "./subject-dialog"
import { SubjectTreeNode } from "./subject-node"

/**
 * `/manage/subjects/`: the subject tree the catalogue, the upload forms and the topics hang from. Add a subject at the
 * top or under another, edit its names (Uzbek, Russian and English), its ББК or УДК code and its address name, move it
 * up or down among its siblings, and archive it (hidden from pickers; restore brings it back).
 */
export function SubjectsPage() {
  const t = useT("library.manage.subjects")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const subjects = useQuery(getManageSubjectsQuery())
  const flat = useMemo<readonly ManageSubject[]>(() => subjects.data ?? [], [subjects.data])
  const tree = useMemo(() => buildTree(flat), [flat])
  const [target, setTarget] = useState<SubjectTarget | null>(null)

  const change = useMutation({
    mutationFn: async (run: () => Promise<unknown>) => run(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.library.all() })
    },
  })

  function move(node: ManageSubject, direction: -1 | 1) {
    const patches = reorderPatches(flat, node.id, direction)
    if (patches.length === 0) return
    change.mutate(() => Promise.all(patches.map((patch) => patchManageSubject(patch.id, { position: patch.position }))))
  }

  function archive(node: ManageSubject) {
    change.mutate(() => patchManageSubject(node.id, { archived: !node.archived }))
  }

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button
          type="button"
          className="min-h-11 md:min-h-8"
          onClick={() => setTarget({ mode: "create", parent: null })}
        >
          <IconPlus aria-hidden />
          {t("add")}
        </Button>
      }
    >
      {subjects.isPending ? (
        <StateView state="loading" rows={3} />
      ) : subjects.isError ? (
        <StateView state="error" error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : tree.length === 0 ? (
        <StateView
          state="empty"
          emptyText={t("empty")}
          action={
            <Button
              type="button"
              className="min-h-11 md:min-h-8"
              onClick={() => setTarget({ mode: "create", parent: null })}
            >
              <IconPlus aria-hidden />
              {t("add")}
            </Button>
          }
        />
      ) : (
        <ul aria-label={t("treeLabel")} className="flex max-w-3xl flex-col gap-2">
          {tree.map((node, index) => (
            <SubjectTreeNode
              key={node.id}
              node={node}
              first={index === 0}
              last={index === tree.length - 1}
              busy={change.isPending}
              onAdd={(parent) => setTarget({ mode: "create", parent })}
              onEdit={(subject) => setTarget({ mode: "edit", subject })}
              onMove={move}
              onArchive={archive}
            />
          ))}
        </ul>
      )}
      {change.isError ? (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {errorMessage(change.error)}
        </p>
      ) : null}
      <SubjectDialog target={target} subjects={flat} onClose={() => setTarget(null)} />
    </PageContainer>
  )
}
