"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { isStaffOnly, useSettingsHref } from "../../../config/nav"
import { useIsAlumnus } from "../../../config/applicant"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ProfileBody } from "../../profile/components/profile-page"
import { AuditList } from "./audit-list"
import { DataControls } from "./data-controls"
import { MentoringSwitches } from "./mentoring-switches"
import { PurposeConsents } from "./purpose-consents"
import { useQuery } from "@tanstack/react-query"
import { mentoringQuery } from "../../mentoring/api"

/** Settings: purpose consents, data export and erasure, and the access log. */
export function SettingsPage() {
  return (
    <Suspense>
      <SettingsBody />
    </Suspense>
  )
}

const TABS = ["privacy", "profile", "data", "activity"]
/** Staff hold no applicant consents or profile: their own data, its access log and, for mentors, the mentor switch. */
const STAFF_TABS = ["data", "activity"]

function SettingsBody() {
  const t = useT("privacy")
  const { session } = useSession()
  const alumnus = useIsAlumnus()
  const router = useRouter()
  const params = useSearchParams()
  const roles = session?.user.roles
  const staffOnly = isStaffOnly(roles, alumnus)
  const target = useSettingsHref()
  // Settings editors who mentor nobody have their own hub; the personal page has nothing for them.
  useEffect(() => {
    if (target === "/staff/settings/") router.replace(target)
  }, [target, router])
  // Staff see the privacy tab only for the mentor switch, the same condition `MentoringSwitches` uses.
  const mentoring = useQuery({ ...mentoringQuery(), enabled: staffOnly })
  const mentor = (mentoring.data?.mentor_assignments ?? 0) > 0
  const shown = staffOnly ? (mentor ? ["privacy", ...STAFF_TABS] : STAFF_TABS) : TABS
  const home = shown[0] ?? "privacy"
  const wanted = params.get("tab") ?? ""
  const tab = shown.includes(wanted) ? wanted : home
  // The tab lives in the URL; the others default to it and keep the hash (`#consent`).
  const setTab = (next: string) => router.replace(next === home ? "/settings/" : `/settings/?tab=${next}`)
  const allTabs = [
    { value: "privacy", label: t("view.privacy"), icon: "lock", tone: "primary" },
    { value: "profile", label: t("view.profile"), icon: "profile", tone: "primary" },
    { value: "data", label: t("view.data"), icon: "files", tone: "warning" },
    { value: "activity", label: t("view.activity"), icon: "eye", tone: "neutral" },
  ] as const
  return (
    <AdmissionShell anyone>
      <div className={pageClass()}>
        <AppPageHeader icon="lock" title={t("title")} />
        <div className="flex flex-col gap-4">
          <UnderlineTabs
            label={t("view.tabs")}
            value={tab}
            onValueChange={setTab}
            tabs={allTabs.filter((item) => shown.includes(item.value))}
          />
          <ScrollFade maxHeight="calc(100svh - 13.5rem)">
            {tab === "privacy" ? (
              <div className="flex flex-col gap-8">
                {staffOnly ? null : <PurposeConsents />}
                <MentoringSwitches />
              </div>
            ) : null}
            {tab === "profile" ? <ProfileBody base="/settings/?tab=profile&section=" /> : null}
            {tab === "data" ? <DataControls /> : null}
            {tab === "activity" ? <AuditList /> : null}
          </ScrollFade>
        </div>
      </div>
    </AdmissionShell>
  )
}
