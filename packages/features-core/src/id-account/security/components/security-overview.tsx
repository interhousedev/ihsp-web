"use client"

import { getIdMeSecurityQuery, getIdMeTelegramQuery, type UserMe } from "@ihsp/api"
import { Badge } from "@ihsp/ui"
import {
  IconActivity,
  IconBrandTelegram,
  IconDeviceMobileMessage,
  IconDevices,
  IconFingerprint,
  IconFileZip,
  IconShieldLock,
  IconKey,
  IconMail,
  IconPalette,
  IconPlugConnected,
  IconSchool,
  IconTrash,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { fullName } from "../../../lesson-detail/utils/people"
import { useTr } from "../../shared/hooks/use-tr"
import { EmisReauthBanner } from "./emis-reauth-banner"
import { OnOffBadge } from "./on-off-badge"
import { SecurityCard } from "./security-card"

/** The cards of the security overview (UF-ID-04 to UF-ID-16 start here). */
export function SecurityOverview({ user }: { user: UserMe }) {
  const t = useTr()
  const isStudent = user.roles.includes("student")
  const factors = useQuery(getIdMeSecurityQuery()).data
  const telegram = useQuery(getIdMeTelegramQuery()).data
  return (
    <div className="grid gap-4">
      {user.emis_status === "needs_reauth" ? <EmisReauthBanner /> : null}
      <section className="flex flex-wrap items-center gap-2" aria-label={t("security.profile")}>
        <span className="text-lg font-medium">{fullName(user)}</span>
        {user.login ? <code className="text-muted-foreground text-sm">{user.login}</code> : null}
        {user.roles.map((role) => (
          <Badge key={role} variant="outline">
            {t(`security.roles.${role}`)}
          </Badge>
        ))}
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SecurityCard href="/security/password/" icon={IconKey} title={t("security.cards.password")} />
        <SecurityCard
          href="/security/otp/"
          icon={IconDeviceMobileMessage}
          title={t("security.cards.otp")}
          status={<OnOffBadge on={user.otp_enabled} onLabel={t("security.on")} offLabel={t("security.off")} />}
        />
        <SecurityCard
          href="/security/totp/"
          icon={IconShieldLock}
          title={t("security.cards.totp")}
          status={
            factors ? (
              <OnOffBadge on={factors.totp_enabled} onLabel={t("security.on")} offLabel={t("security.off")} />
            ) : undefined
          }
        />
        <SecurityCard
          href="/security/passkeys/"
          icon={IconFingerprint}
          title={t("security.cards.passkeys")}
          status={
            factors ? (
              <Badge variant="outline">{t("security.cards.passkeyCount", { count: factors.passkeys.length })}</Badge>
            ) : undefined
          }
        />
        <SecurityCard
          href="/security/telegram/"
          icon={IconBrandTelegram}
          title={t("security.cards.telegram")}
          status={
            telegram ? (
              <Badge variant="outline">{t("security.cards.telegramCount", { count: telegram.length })}</Badge>
            ) : undefined
          }
        />
        <SecurityCard
          href="/security/email/"
          icon={IconMail}
          title={t("security.cards.email")}
          description={user.recovery_email ?? t("security.cards.emailMissing")}
        />
        <SecurityCard href="/security/sessions/" icon={IconDevices} title={t("security.cards.sessions")} />
        <SecurityCard href="/security/activity/" icon={IconActivity} title={t("security.cards.activity")} />
        {isStudent ? (
          <SecurityCard
            href="/security/emis/"
            icon={IconSchool}
            title={t("security.cards.emis")}
            status={
              user.emis_status === "needs_reauth" ? (
                <Badge variant="destructive">{t("security.cards.emisNeedsReauth")}</Badge>
              ) : (
                <Badge variant="secondary">{t("security.cards.emisActive")}</Badge>
              )
            }
          />
        ) : null}
        <SecurityCard href="/connectors/" icon={IconPlugConnected} title={t("security.cards.connectors")} />
        <SecurityCard href="/appearance/" icon={IconPalette} title={t("security.cards.appearance")} />
        <SecurityCard href="/security/delete/#export" icon={IconFileZip} title={t("security.cards.export")} />
        {isStudent ? (
          <SecurityCard href="/security/delete/" icon={IconTrash} destructive title={t("security.cards.delete")} />
        ) : null}
      </div>
    </div>
  )
}
