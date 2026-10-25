"use client"

import type { ResourceItem, StaffLesson } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, StateView } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useDeleteResource, useHideResource } from "../hooks/use-lesson-mutations"
import { ResourceList } from "./resource-list"

/**
 * Attachments of the lesson (students and the teacher, ACA-9). The teacher hides an inappropriate or wrong student
 * attachment and shows it again (STF-6, UF-STF-08): hidden ones disappear for students and from the room page.
 */
export function AttachmentsSection({
  lessonId,
  attachments,
}: {
  lessonId: string
  attachments: StaffLesson["attachments"]
}) {
  const t = useT("lessonDetail.attachments")
  const errorMessage = useErrorMessage()
  const titleId = useId()
  const { session } = useSession()
  const [pending, setPending] = useState<ResourceItem | null>(null)
  const hide = useHideResource(lessonId)
  const remove = useDeleteResource(lessonId)

  function toggleHidden(item: ResourceItem) {
    hide.mutate(
      { linkId: item.link_id, hidden: !item.hidden },
      { onSuccess: () => toast.success(item.hidden ? t("shown") : t("hiddenDone")) },
    )
  }

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
    <section aria-labelledby={titleId}>
      <Card>
        <CardHeader>
          <CardTitle id={titleId} className="text-base">
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {attachments.length === 0 ? (
            <StateView state="empty" emptyText={t("empty")} />
          ) : (
            <ResourceList
              items={attachments}
              currentUserId={session?.user.id}
              canDeleteAny={session?.user.roles.includes("admin") ?? false}
              busyId={hide.isPending ? hide.variables?.linkId : null}
              onToggleHidden={toggleHidden}
              onDelete={(item) => {
                remove.reset()
                setPending(item)
              }}
            />
          )}
          {hide.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(hide.error)}
            </p>
          ) : null}
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
