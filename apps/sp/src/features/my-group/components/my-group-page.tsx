"use client"

import {
  getMyGroupProgressQuery,
  getMyGroupQuery,
  type GroupMemberRow,
  type GroupPersonRef,
  type GroupTeacherRef,
  type TeacherContacts,
  isApiError,
} from "@ihsp/api"
import { GroupProgressSection, HidePhotoSwitch } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge, PageContainer, StateView, UserAvatar } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { GroupRatingSection } from "@/features/grades/components/group-rating-section"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { studentRecordStatusOf } from "../../shared/hooks/use-student-record-state"
import { NO_GROUP, type GroupStanding as Standing } from "../api/group-standing"
import { GroupRanksSection, GroupTopSection, LyceumRatingLink } from "./group-standing"

type Person = GroupPersonRef | GroupTeacherRef

function fullName(person: Person): string {
  return `${person.first_name} ${person.last_name}`
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
          <UserAvatar
            name={fullName(person)}
            imageUrl={person.photo_url}
            placeholder="person"
            className="size-14 text-base"
          />
          <p className="min-w-0 font-semibold break-words">{fullName(person)}</p>
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
          <dd className="break-words">{line.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MemberList({ members }: { members: GroupMemberRow[] }) {
  const t = useT("myGroup")
  if (members.length === 0) return null
  return (
    <section aria-labelledby="my-group-members" className="flex flex-col gap-2">
      <h2 id="my-group-members" className="text-base font-semibold">
        {t("members")}
      </h2>
      <ul aria-label={t("members")} className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <li key={member.id} className="bg-card flex min-h-14 items-center gap-3 rounded-card border p-3">
            <UserAvatar
              name={fullName(member)}
              imageUrl={member.photo_url}
              placeholder="person"
              className="size-10 text-sm"
            />
            <span className="min-w-0 flex-1 break-words">{fullName(member)}</span>
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
  const ts = useT("groupStanding")
  const nav = useT("nav")
  const query = useQuery(getMyGroupQuery())
  const group = query.data
  // The contract fields (course, curator, tops, ranks) ride on the same response; typed by hand until regeneration.
  const standing = group as Standing | undefined
  const course = standing?.group?.course ?? null
  const noGroup = query.isError && isApiError(query.error) && query.error.type === NO_GROUP
  const recordStatus = query.isError ? studentRecordStatusOf(query.error) : null

  return (
    <PageContainer title={nav("myGroup")}>
      {group ? (
        <div className="flex flex-col gap-4 pb-20">
          <section
            aria-label={group.name}
            className="bg-card text-card-foreground flex flex-col gap-1 rounded-card border p-4"
          >
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <p className="text-muted-foreground text-sm tabular-nums">
              {course !== null ? `${ts("course", { course })} · ` : ""}
              {t("size", { count: standing?.members_count ?? group.size })}
            </p>
          </section>

          <div className="grid gap-3 min-[400px]:grid-cols-2">
            <RoleCard label={ts("curator")} person={group.homeroom_teacher}>
              {group.homeroom_teacher ? <TeacherContactList contacts={group.homeroom_teacher.contacts} /> : null}
            </RoleCard>
            <RoleCard label={t("headStudent")} person={group.head_student} />
          </div>

          <div className="bg-card rounded-card border px-4 py-1">
            <HidePhotoSwitch />
          </div>

          {standing ? <GroupRanksSection standing={standing} /> : null}
          {standing ? <GroupTopSection standing={standing} /> : null}
          <LyceumRatingLink />

          <MemberList members={group.members} />

          {group.is_head_student ? (
            <>
              <GroupProgressSection queryFor={getMyGroupProgressQuery} />
              <GroupRatingSection semester={undefined} />
            </>
          ) : null}
        </div>
      ) : noGroup ? (
        <StateView state="empty" title={ts("noGroupTitle")} description={ts("noGroupHint")} />
      ) : recordStatus === "missing" || recordStatus === "emis-failed" ? (
        <NoStudentRecordNotice reason={recordStatus} />
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
