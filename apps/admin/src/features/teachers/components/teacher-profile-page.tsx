"use client"

import { getTeacherProfile, keys, postAdminTeacherDeactivate, type TeacherProfile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  PageContainer,
  StateView,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { BackLink } from "../../shared/components/back-link"
import { LessonList } from "../../shared/components/lesson-list"
import { QueryState } from "../../shared/components/query-state"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { SetPasswordDialog } from "../../users/components/set-password-dialog"
import { EditTeacherDialog } from "./edit-teacher-dialog"
import { TeacherContactsSection } from "./teacher-contacts-section"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function ProfileBody({ data }: { data: TeacherProfile }) {
  const t = useT("teachers.profile")
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { user } = data
  const name = fullNameWithMiddle(user)

  const deactivate = useAdminMutation({
    mutationFn: () => postAdminTeacherDeactivate(user.id),
    invalidate: [keys.admin.teachers.all(), keys.admin.users.all()],
    success: t("deactivated", { name }),
    onSuccess: () => setDeactivateOpen(false),
  })

  return (
    <PageContainer
      title={name}
      description={[user.login, user.recovery_email].filter(Boolean).join(" · ")}
      actions={
        <>
          <BackLink href="/teachers/" label={t("back")} />
          <Button type="button" variant="outline" className={TOUCH} onClick={() => setEditOpen(true)}>
            {t("edit")}
          </Button>
          <Button type="button" variant="outline" className={TOUCH} onClick={() => setPasswordOpen(true)}>
            {t("setPassword")}
          </Button>
          {user.status !== "deactivated" ? (
            <Button type="button" variant="destructive" className={TOUCH} onClick={() => setDeactivateOpen(true)}>
              {t("deactivate")}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={user.status} />
        <Link
          href={`/users/view/?id=${encodeURIComponent(user.id)}`}
          className="text-sm underline-offset-4 hover:underline"
        >
          {t("openInUsers")}
        </Link>
      </div>

      <TeacherContactsSection teacherId={user.id} />

      <Section title={t("curatedGroups")}>
        {data.curated_groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noGroups")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.curated_groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/view/?id=${encodeURIComponent(group.id)}`}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted min-h-11 inline-flex items-center md:min-h-8"
                >
                  {group.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("missingAttendance")}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {t("missingCount")}
              <Badge variant={data.missing_attendance.length > 0 ? "destructive" : "secondary"}>
                {data.missing_attendance.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LessonList lessons={data.missing_attendance} emptyText={t("noMissing")} />
          </CardContent>
        </Card>
      </Section>

      <Section title={t("timetable")}>
        <LessonList lessons={data.timetable_week} />
      </Section>

      <EditTeacherDialog teacher={user} open={editOpen} onOpenChange={setEditOpen} />
      <SetPasswordDialog userId={user.id} name={name} open={passwordOpen} onOpenChange={setPasswordOpen} />
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={t("deactivateTitle", { name })}
        description={t("deactivateDescription")}
        confirmLabel={t("deactivate")}
        destructive
        loading={deactivate.isPending}
        onConfirm={() => deactivate.mutate()}
      />
    </PageContainer>
  )
}

/** Teacher profile (ADM-4): timetable of the week, lessons without attendance, curated groups, edit and deactivate. */
export function TeacherProfilePage() {
  const t = useT("teachers")
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery({
    queryKey: keys.admin.teachers.profile(id ?? ""),
    queryFn: ({ signal }) => getTeacherProfile(id ?? "", { signal }),
    enabled: id !== null,
  })
  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("notSelected")} />
      </PageContainer>
    )
  }
  return (
    <QueryState query={query} rows={4}>
      {(data) => <ProfileBody data={data} />}
    </QueryState>
  )
}
