"use client"

import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import {
  AppearancePage,
  ConnectorsPage,
  IdAccountBaseProvider,
  PersonalTokensPage,
  SecurityOverview,
} from "@ihsp/features-core/id-account"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useEffect, useRef, type ReactNode } from "react"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { isRecordBlocked, useStudentRecordState } from "../../shared/hooks/use-student-record-state"

/**
 * The embedded id pages bring their own page title (an `h1` each). A page has one `h1`, so the ones below this
 * wrapper become level-2 headings; their text and place stay.
 */
function EmbeddedSections({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const demote = () => {
      for (const heading of root.querySelectorAll("h1")) {
        heading.setAttribute("role", "heading")
        heading.setAttribute("aria-level", "2")
      }
    }
    demote()
    const observer = new MutationObserver(demote)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="flex min-w-0 flex-col gap-4">
      {children}
    </div>
  )
}

/** The iht.id account (security, connectors, personal tokens, appearance) inside the sp shell; sub-pages open on the ID app. */
export function AccountPage() {
  const t = useT("profile.accountPage")
  const { session } = useSession()
  const record = useStudentRecordState()
  if (!session) return null
  return (
    <IdAccountBaseProvider base={getConfig().ID_URL}>
      <PageContainer title={t("title")}>
        {isRecordBlocked(record.status) ? <NoStudentRecordNotice reason={record.status} /> : null}
        <section aria-labelledby="account-security" className="grid gap-3">
          <h2 id="account-security" className="text-lg font-medium">
            {t("security")}
          </h2>
          <SecurityOverview user={session.user} />
        </section>
        <EmbeddedSections>
          <ConnectorsPage />
          <PersonalTokensPage />
          <AppearancePage />
        </EmbeddedSections>
      </PageContainer>
    </IdAccountBaseProvider>
  )
}
