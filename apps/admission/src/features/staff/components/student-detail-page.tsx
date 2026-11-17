"use client"

import { pageClass } from "../../../components/lib/page"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons, PageHeader, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { StaffReviewTab } from "../../app-review/components/staff-review-tab"
import { CommentsPanel } from "../../comments/components/comments-panel"
import { StaffChecklistTab } from "../../documents/components/staff-checklist-tab"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { TestsBody } from "../../test-scores/components/tests-page"
import { StudentReadiness } from "../../readiness/student-readiness"
import { AssignDialog } from "./assign-dialog"
import { STAFF_ROLES } from "./caseload-page"
import { useCaseload } from "../api"
import { AlignmentTab, CoursesTab, ListTab, ProfileTab, WordsTab } from "./student-tabs"

export const STUDENT_TABS = [
  "profile",
  "words",
  "alignment",
  "courses",
  "list",
  "tests",
  "review",
  "checklist",
  "comments",
] as const
export type StudentTab = (typeof STUDENT_TABS)[number]

const TAB_ICON = {
  profile: Icons.profile,
  words: Icons.text,
  alignment: Icons.route,
  courses: Icons.kanban,
  list: Icons.page,
  tests: Icons.checks,
  review: Icons.eye,
  checklist: Icons.circleCheck,
  comments: Icons.chat,
} as const

/** Comment targets of the student's own objects; their id is the student id. */
const COMMENT_TARGETS = ["profile", "words"] as const

/** `/staff/students/view/?id=&tab=`: a static-export-safe detail page (the id is a query parameter). */
export function StudentDetailPage() {
  const t = useT("staff")
  const params = useSearchParams()
  const router = useRouter()
  const { session } = useSession()
  const id = params.get("id") ?? ""
  const requested = params.get("tab")
  const roles = session?.user.roles ?? []
  const mentorOnly = roles.includes("mentor") && !roles.some((r) => r === "admin" || r === "counselor")
  const tabs = STUDENT_TABS.filter((value) => value !== "checklist" || !mentorOnly)
  const tab: StudentTab = tabs.find((value) => value === requested) ?? "profile"
  const canAssign = roles.some((role) => role === "admin" || role === "counselor")
  const caseload = useCaseload({})
  const name = caseload.data?.items.find((item) => item.student_id === id)?.student_name

  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <div className={pageClass("wide")}>
        <PageHeader
          title={name ?? t("student.title")}
          back={
            <Link
              href="/staff/"
              aria-label={t("student.back")}
              className="-m-2 inline-flex size-11 items-center justify-center md:size-9"
            >
              <Icons.chevronLeft className="size-4" />
            </Link>
          }
          actions={id && canAssign ? <AssignDialog studentId={id} /> : null}
        />
        {id ? <StudentReadiness studentId={id} /> : null}
        {!id ? (
          <StateView state="empty" title={t("student.noId")} />
        ) : (
          <Tabs value={tab} onValueChange={(next) => router.replace(`/staff/students/view/?id=${id}&tab=${next}`)}>
            <TabsList className="max-w-full justify-start overflow-x-auto [&>*]:shrink-0">
              {tabs.map((value) => {
                const Icon = TAB_ICON[value]
                return (
                  <TabsTrigger key={value} value={value} className="min-h-11 gap-1.5 md:min-h-9">
                    <Icon aria-hidden className="size-4" />
                    {t(`tabs.${value}`)}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            <TabsContent value="profile">
              <ProfileTab studentId={id} />
            </TabsContent>
            <TabsContent value="words">
              <WordsTab studentId={id} />
            </TabsContent>
            <TabsContent value="alignment">
              <AlignmentTab studentId={id} />
            </TabsContent>
            <TabsContent value="courses">
              <CoursesTab studentId={id} />
            </TabsContent>
            <TabsContent value="list">
              <ListTab studentId={id} />
            </TabsContent>
            <TabsContent value="review">
              <StaffReviewTab studentId={id} />
            </TabsContent>
            <TabsContent value="checklist">
              <StaffChecklistTab studentId={id} />
            </TabsContent>
            <TabsContent value="tests">
              <TestsBody studentId={id} staffEmpty={t("student.testsEmpty")} />
            </TabsContent>
            <TabsContent value="comments">
              <div className="flex flex-col gap-6">
                {COMMENT_TARGETS.map((kind) => (
                  <div key={kind} className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold">{t(`tabs.${kind}`)}</h2>
                    <CommentsPanel target={{ studentId: id, kind, id }} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdmissionShell>
  )
}
