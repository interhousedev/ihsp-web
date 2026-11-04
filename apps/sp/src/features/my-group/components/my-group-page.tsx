"use client"

import {
  getMyGroupProgressQuery,
  getMyGroupQuery,
  type GroupMemberRow,
  type GroupPersonRef,
  type GroupTeacherRef,
  type TeacherContacts,
} from "@ihsp/api"
import { GroupProgressSection } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Avatar, AvatarFallback, Badge, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { GroupRatingSection } from "@/features/grades/components/group-rating-section"

type Person = GroupPersonRef | GroupTeacherRef

function initials(person: Person): string {
  return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase()
}

/** The public contacts a student may see of the homeroom teacher; blank ones are left out. */
function contactLines(contacts: TeacherContacts): { key: keyof TeacherContacts; value: string }[] {
  const lines: { key: keyof TeacherContacts; value: string }[] = []
  if (contacts.telegram) lines.push({ key: "telegram", value: `@${contacts.telegram}` })
  if (contacts.email) lines.push({ key: "email", value: contacts.email })
  if (contacts.phone) lines.push({ key: "phone", value: contacts.phone })
  if (contacts.office_hours) lines.push({ key: "office_hours", value: contacts.office_hours })
  if (contacts.office) lines.push({ key: "office", value: contacts.office })
  if (contacts.note) lines.push({ key: "note", value: contacts.note })
  return lines
}

const CONTACT_LABEL: Record<keyof TeacherContacts, "telegram" | "email" | "phone" | "officeHours" | "office" | "note"> =
  {
    telegram: "telegram",
    email: "email",
    phone: "phone",
    office_hours: "officeHours",
    office: "office",
    note: "note",
  }

function RoleCard({ label, person, children }: { label: string; person: Person | null; children?: ReactNode }) {
  const t = useT("myGroup")
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-card text-card-foreground flex flex-col gap-3 rounded-card border p-4"
    >
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {person ? (
        <div className="flex items-center gap-3">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback>{initials(person)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 font-semibold break-words">
            {person.first_name} {person.last_name}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("notAssigned")}</p>
      )}
      {children}
    </div>
  )
}

function TeacherContactList({ contacts }: { contacts: TeacherContacts }) {
  const t = useT("myGroup")
  const lines = contactLines(contacts)
  if (lines.length === 0) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {lines.map((line) => (
        <div key={line.key} className="contents">
          <dt className="text-muted-foreground">{t(CONTACT_LABEL[line.key])}</dt>
          <dd className="break-all">{line.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MemberList({ members }: { members: GroupMemberRow[] }) {
  const t = useT("myGroup")
  return (
    <section aria-labelledby="my-group-members" className="flex flex-col gap-2">
      <h2 id="my-group-members" className="text-base font-semibold">
        {t("members")}
      </h2>
      <ul aria-label={t("members")} className="bg-card divide-y rounded-card border">
        {members.map((member) => (
          <li key={member.id} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
            <span className="min-w-0 break-words">
              {member.first_name} {member.last_name}
            </span>
            <span className="flex shrink-0 gap-1">
              {member.is_head_student ? <Badge variant="secondary">{t("head")}</Badge> : null}
              {member.is_me ? <Badge variant="outline">{t("you")}</Badge> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** My group: the group card, the homeroom teacher and head student, the members, and for the head student the marks. */
export function MyGroupPage() {
  const t = useT("myGroup")
  const nav = useT("nav")
  const query = useQuery(getMyGroupQuery())
  const group = query.data

  return (
    <PageContainer title={nav("myGroup")}>
      {group ? (
        <div className="flex flex-col gap-4">
          <section
            aria-label={group.name}
            className="bg-card text-card-foreground flex flex-col gap-1 rounded-card border p-4"
          >
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <p className="text-muted-foreground text-sm tabular-nums">{t("size", { count: group.size })}</p>
          </section>

          <div className="grid gap-3 min-[400px]:grid-cols-2">
            <RoleCard label={t("homeroomTeacher")} person={group.homeroom_teacher}>
              {group.homeroom_teacher ? <TeacherContactList contacts={group.homeroom_teacher.contacts} /> : null}
            </RoleCard>
            <RoleCard label={t("headStudent")} person={group.head_student} />
          </div>

          <MemberList members={group.members} />

          {group.is_head_student ? (
            <>
              <GroupProgressSection queryFor={getMyGroupProgressQuery} />
              <GroupRatingSection semester={undefined} />
            </>
          ) : null}
        </div>
      ) : (
        <StateView
          state={query.isError ? "error" : "loading"}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      )}
    </PageContainer>
  )
}
