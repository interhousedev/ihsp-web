"use client"

import {
  deleteLmsCourseStaff,
  getLmsCourseStaffQuery,
  keys,
  patchLmsCourseStaff,
  postLmsCourseStaff,
  type CourseStaffItem,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Button, Card, CardContent, ConfirmDialog, Icons } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { personName } from "../../shared/utils/people"
import { can } from "../../shared/utils/permissions"
import { InviteCodeCard } from "./invite-code-card"
import { StaffFormDialog, type StaffFormValues } from "./staff-form-dialog"

/** `/edit/staff/?id=`: course staff with role, permissions, visibility and order; invite code (UF-LMS-06, UF-LMS-07). */
export function StaffPage({ courseId }: { courseId: string }) {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const staff = useQuery(getLmsCourseStaffQuery(courseId))
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<CourseStaffItem | null>(null)
  const [removing, setRemoving] = useState<CourseStaffItem | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.lms.staff(courseId) })
    // the public course page shows the staff members with "show on page"
    void queryClient.invalidateQueries({ queryKey: ["lms", "course"] })
  }

  const add = useMutation<CourseStaffItem, unknown, StaffFormValues>({
    mutationFn: (values) => postLmsCourseStaff(courseId, values),
    onSuccess: (item) => {
      setAdding(false)
      refresh()
      toast.success(t("added", { name: personName(item.user) }))
    },
  })
  const update = useMutation<CourseStaffItem, unknown, { userId: string; values: StaffFormValues }>({
    mutationFn: ({ userId, values }) =>
      patchLmsCourseStaff(courseId, userId, {
        role: values.role,
        permissions: values.permissions,
        show_on_page: values.show_on_page,
        position: values.position,
      }),
    onSuccess: (item) => {
      setEditing(null)
      refresh()
      toast.success(t("updated", { name: personName(item.user) }))
    },
  })
  const remove = useMutation<unknown, unknown, CourseStaffItem>({
    mutationFn: (item) => deleteLmsCourseStaff(courseId, item.user.id),
    onSuccess: (_result, item) => {
      setRemoving(null)
      refresh()
      toast.success(t("removed", { name: personName(item.user) }))
    },
  })

  return (
    <EditorFrame courseId={courseId} current="staff" title={t("title")}>
      {(permissions) => {
        const canManage = can(permissions, "manage_staff")
        const sorted = (staff.data ?? []).toSorted((a, b) => a.position - b.position)
        const nextPosition = sorted.reduce((max, item) => Math.max(max, item.position), 0) + 1
        return (
          <div className="flex flex-col gap-4">
            {canManage ? (
              <div>
                <Button onClick={() => setAdding(true)} className="min-h-11 md:min-h-8">
                  <Icons.add aria-hidden />
                  {t("add")}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("readOnly")}</p>
            )}
            {remove.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(remove.error)}</AlertDescription>
              </Alert>
            ) : null}
            <QueryState query={staff} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
              {() => (
                <ul className="flex flex-col gap-3">
                  {sorted.map((item) => (
                    <li key={item.user.id}>
                      <Card>
                        <CardContent className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{personName(item.user)}</span>
                            <Badge variant="secondary">{item.role}</Badge>
                            <Badge variant={item.show_on_page ? "outline" : "secondary"}>
                              {item.show_on_page ? t("shown") : t("hidden")}
                            </Badge>
                            <span className="text-muted-foreground text-xs">#{item.position}</span>
                          </div>
                          <ul className="flex flex-wrap gap-1.5" aria-label={t("permissions")}>
                            {item.permissions.map((permission) => (
                              <li key={permission}>
                                <Badge variant="outline">{t(`permissionNames.${permission}`)}</Badge>
                              </li>
                            ))}
                            {item.permissions.length === 0 ? (
                              <li className="text-muted-foreground text-xs">{t("noPermissions")}</li>
                            ) : null}
                          </ul>
                          {canManage ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditing(item)}
                                className="min-h-11 md:min-h-7"
                              >
                                <Icons.edit aria-hidden />
                                {t("edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRemoving(item)}
                                className="min-h-11 md:min-h-7"
                              >
                                <Icons.trash aria-hidden />
                                {t("remove")}
                              </Button>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>

            {canManage ? (
              <InviteCodeCard
                courseId={courseId}
                canReadDraft={can(permissions, "edit") || can(permissions, "view_drafts")}
              />
            ) : null}

            {adding ? (
              <StaffFormDialog
                key="add"
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setAdding(false)
                    add.reset()
                  }
                }}
                mode="add"
                nextPosition={nextPosition}
                pending={add.isPending}
                error={add.error}
                onSubmit={(values) => add.mutate(values)}
              />
            ) : null}
            {editing ? (
              <StaffFormDialog
                key={editing.user.id}
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setEditing(null)
                    update.reset()
                  }
                }}
                mode="edit"
                initial={editing}
                nextPosition={nextPosition}
                pending={update.isPending}
                error={update.error}
                onSubmit={(values) => update.mutate({ userId: editing.user.id, values })}
              />
            ) : null}
            <ConfirmDialog
              open={removing !== null}
              onOpenChange={(open) => !open && setRemoving(null)}
              title={t("removeTitle")}
              confirmLabel={t("remove")}
              destructive
              loading={remove.isPending}
              onConfirm={() => {
                if (removing) remove.mutate(removing)
              }}
            />
          </div>
        )
      }}
    </EditorFrame>
  )
}
