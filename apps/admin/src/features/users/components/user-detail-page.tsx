"use client"

import { getAdminUser, keys, type AdminUserDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useState, type ReactNode } from "react"
import { ExtensionBadge } from "../../limits/components/extension-badge"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { StatusBadge } from "../../shared/components/status-badge"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { AuditList } from "./audit-list"
import { BlockActions } from "./block-actions"
import { CredentialResetActions } from "./credential-reset-actions"
import { EditUserDialog } from "./edit-user-dialog"
import { MailActions } from "./mail-actions"
import { RolesEditor } from "./roles-editor"
import { SetPasswordDialog } from "./set-password-dialog"
import { SessionList } from "./session-list"
import { TelegramAccounts } from "./telegram-accounts"
import { UserPhotoSection } from "./user-photo-section"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function DetailBody({ user }: { user: AdminUserDetail }) {
  const t = useT("users.detail")
  const f = useFormatters()
  const name = fullNameWithMiddle(user)
  const isAdmin = user.roles.includes("admin")
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  return (
    <PageContainer
      title={name}
      description={[user.login, user.recovery_email].filter(Boolean).join(" · ")}
      actions={
        <>
          <BackLink href="/users/" label={t("back")} />
          <Button type="button" variant="outline" className={TOUCH} onClick={() => setEditOpen(true)}>
            {t("edit")}
          </Button>
          {isAdmin ? null : (
            <Button type="button" variant="outline" className={TOUCH} onClick={() => setPasswordOpen(true)}>
              {t("setPassword")}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <StatusBadge status={user.status} />
        <ExtensionBadge userId={user.id} />
        <span className="text-muted-foreground">
          {user.created_at ? t("created", { date: f.date(user.created_at) }) : null}
        </span>
        <span className="text-muted-foreground">
          {user.last_login_at ? t("lastLogin", { date: f.dateTime(user.last_login_at) }) : t("neverLoggedIn")}
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("access")}>
          <BlockActions userId={user.id} name={name} blocked={user.status === "blocked"} />
          {isAdmin ? (
            <CredentialResetActions userId={user.id} name={name} />
          ) : (
            <p className="text-muted-foreground text-xs">{t("resetOnlyAdmins")}</p>
          )}
        </Section>
        <Section title={t("roles")}>
          <RolesEditor user={user} />
        </Section>
        {user.roles.includes("teacher") ? (
          <UserPhotoSection userId={user.id} name={name} photoUrl={user.photo_url} />
        ) : null}
        <Section title={t("mail")}>
          <MailActions user={user} />
        </Section>
        <Section title={t("telegram")}>
          <TelegramAccounts accounts={user.telegram} />
        </Section>
        <Section title={t("sessions")}>
          <SessionList sessions={user.sessions} />
        </Section>
        <Section title={t("audit")}>
          <AuditList events={user.recent_audit} />
        </Section>
      </div>
      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
      <SetPasswordDialog userId={user.id} name={name} open={passwordOpen} onOpenChange={setPasswordOpen} />
    </PageContainer>
  )
}

/** One user (ADM-5, UF-ADM-11, UF-ADM-15): block, roles, credential resets, mail and the account history. */
export function UserDetailPage() {
  const t = useT("users")
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery({
    queryKey: keys.admin.users.detail(id ?? ""),
    queryFn: ({ signal }) => getAdminUser(id ?? "", { signal }),
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
      {(user) => <DetailBody user={user} />}
    </QueryState>
  )
}
