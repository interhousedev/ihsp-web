"use client"

import type { ResourceItem, StaffLesson } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, ConfirmDialog, StateView } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useDeleteResource } from "../hooks/use-lesson-mutations"
import { AddMaterialDialog } from "./add-material-dialog"
import { ResourceList } from "./resource-list"

/**
 * Materials of the lesson (STF-4, STF-5, UF-STF-04): the teacher's files and links, with Add material and delete for
 * their own items. `defaultOpen` opens the add dialog (the Today quick action).
 */
export function MaterialsSection({
  lesson,
  materials,
  defaultOpen,
  onAddClosed,
}: {
  lesson: StaffLesson["lesson"]
  materials: ResourceItem[]
  defaultOpen: boolean
  onAddClosed: () => void
}) {
  const t = useT("lesson.materials")
  const errorMessage = useErrorMessage()
  const titleId = useId()
  const { session } = useSession()
  const [pending, setPending] = useState<ResourceItem | null>(null)
  const remove = useDeleteResource(lesson.id)

  function confirmDelete() {
    if (!pending) return
    remove.mutate(pending.link_id, {
      onSuccess: () => {
        setPending(null)
        toast.success(t("deleted"))
      },
    })
  }

  return (
    <section id="materials" aria-labelledby={titleId} className="scroll-mt-20">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle id={titleId} className="text-base">
            {t("title")}
          </CardTitle>
          <AddMaterialDialog lesson={lesson} defaultOpen={defaultOpen} onClose={onAddClosed} />
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <StateView state="empty" emptyText={t("empty")} />
          ) : (
            <ResourceList
              items={materials}
              currentUserId={session?.user.id}
              busyId={remove.isPending ? pending?.link_id : null}
              onDelete={(item) => {
                remove.reset()
                setPending(item)
              }}
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={t("deleteTitle")}
        description={pending ? t("deleteDescription", { title: pending.title }) : undefined}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  )
}
