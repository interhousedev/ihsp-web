"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Icons, PageHeader } from "@ihsp/ui"
import { useState } from "react"
import { isStaffOnly } from "../../../config/nav"
import { AsideCard, HeadingIcon, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { AuditList } from "./audit-list"
import { DataControls } from "./data-controls"
import { MentoringSwitches } from "./mentoring-switches"
import { PurposeConsents } from "./purpose-consents"

/** Settings: purpose consents, data export and erasure, and the access log. */
export function SettingsPage() {
  const t = useT("privacy")
  const { session } = useSession()
  const [tab, setTab] = useState("privacy")
  return (
    <AdmissionShell anyone>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("title")} back={<HeadingIcon name="lock" />} />
        <SplitLayout
          aside={
            <AsideCard title={t("view.asideTitle")} icon={<Icons.lock aria-hidden className="size-4" />}>
              <p className="text-muted-foreground text-sm">{t("view.asideText")}</p>
            </AsideCard>
          }
        >
          <div className="flex flex-col gap-4">
            <UnderlineTabs
              label={t("view.tabs")}
              value={tab}
              onValueChange={setTab}
              tabs={[
                { value: "privacy", label: t("view.privacy"), icon: "lock", tone: "primary" },
                { value: "data", label: t("view.data"), icon: "files", tone: "warning" },
                { value: "activity", label: t("view.activity"), icon: "eye", tone: "neutral" },
              ]}
            />
            {tab === "privacy" ? (
              <div className="flex flex-col gap-8">
                {isStaffOnly(session?.user.roles) ? null : <PurposeConsents />}
                <MentoringSwitches />
              </div>
            ) : null}
            {tab === "data" ? <DataControls /> : null}
            {tab === "activity" ? (
              <ScrollFade maxHeight="70vh">
                <AuditList />
              </ScrollFade>
            ) : null}
          </div>
        </SplitLayout>
      </div>
    </AdmissionShell>
  )
}
