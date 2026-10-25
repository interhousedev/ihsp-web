"use client"

import type { Student360 } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { AuditList } from "../../users/components/audit-list"
import { BlockActions } from "../../users/components/block-actions"
import { SessionList } from "../../users/components/session-list"
import { TelegramAccounts } from "../../users/components/telegram-accounts"
import { fullName } from "../../shared/utils/names"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

/** Telegram accounts, sessions, audit events and the revoke and block actions (UF-ADM-03 step 3). */
export function StudentAccountTab({ data }: { data: Student360 }) {
  const t = useT("students")
  return (
    <div className="flex flex-col gap-5">
      <BlockActions
        userId={data.profile.user_id}
        name={fullName(data.profile)}
        blocked={data.profile.status === "blocked"}
      />
      <Section title={t("account.telegram")}>
        <TelegramAccounts accounts={data.telegram} />
      </Section>
      <Section title={t("account.sessions")}>
        <SessionList sessions={data.sessions} />
      </Section>
      <Section title={t("account.audit")}>
        <AuditList events={data.audit} />
      </Section>
    </div>
  )
}
