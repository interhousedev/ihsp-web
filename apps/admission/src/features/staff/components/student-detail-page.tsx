"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons, PageHeader, StateView, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CommentsPanel } from "../../comments/components/comments-panel"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { AssignDialog } from "./assign-dialog"
import { STAFF_ROLES } from "./caseload-page"
import { AlignmentTab, CoursesTab, ListTab, ProfileTab, WordsTab } from "./student-tabs"

export const STUDENT_TABS = ["profile", "words", "alignment", "courses", "list", "comments"] as const
export type StudentTab = (typeof STUDENT_TABS)[number]

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
  const tab: StudentTab = STUDENT_TABS.find((value) => value === requested) ?? "profile"
  const canAssign = !!session?.user.roles.some((role) => role === "admin" || role === "counselor")

  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
        <PageHeader
          title={t("student.title")}
          back={
            <Link href="/staff/" aria-label={t("student.back")}>
              <Icons.chevronLeft className="size-4" />
            </Link>
          }
          actions={id && canAssign ? <AssignDialog studentId={id} /> : null}
        />
        {!id ? (
          <StateView state="empty" title={t("student.noId")} />
        ) : (
          <Tabs value={tab} onValueChange={(next) => router.replace(`/staff/students/view/?id=${id}&tab=${next}`)}>
            <TabsList className="max-w-full overflow-x-auto">
              {STUDENT_TABS.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {t(`tabs.${value}`)}
                </TabsTrigger>
              ))}
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
