"use client"

import type { UserMe } from "@ihsp/api"
import { Badge } from "@ihsp/ui"
import {
  IconActivity,
  IconBrandTelegram,
  IconDeviceMobileMessage,
  IconDevices,
  IconKey,
  IconMail,
  IconPlugConnected,
  IconSchool,
  IconTrash,
} from "@tabler/icons-react"
import { useTr } from "../../shared/hooks/use-tr"
import { EmisReauthBanner } from "./emis-reauth-banner"
import { OnOffBadge } from "./on-off-badge"
import { SecurityCard } from "./security-card"

/** The cards of the security overview (UF-ID-04 to UF-ID-16 start here). */
export function SecurityOverview({ user }: { user: UserMe }) {
  const t = useTr()
  const isStudent = user.roles.includes("student")
  return (
    <div className="grid gap-4">
      {user.emis_status === "needs_reauth" ? <EmisReauthBanner /> : null}
      <section className="flex flex-wrap items-center gap-2" aria-label={t("security.profile")}>
        <span className="text-lg font-medium">
          {user.last_name} {user.first_name}
        </span>
        {user.login ? <code className="text-muted-foreground text-sm">{user.login}</code> : null}
        {user.roles.map((role) => (
          <Badge key={role} variant="outline">
            {t(`security.roles.${role}`)}
          </Badge>
        ))}
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SecurityCard
          href="/security/password/"
          icon={IconKey}
          title={t("security.cards.password")}
          description={t("security.cards.passwordHint")}
        />
        <SecurityCard
          href="/security/otp/"
          icon={IconDeviceMobileMessage}
          title={t("security.cards.otp")}
          description={t("security.cards.otpHint")}
          status={<OnOffBadge on={user.otp_enabled} onLabel={t("security.on")} offLabel={t("security.off")} />}
        />
        <SecurityCard
          href="/security/telegram/"
          icon={IconBrandTelegram}
          title={t("security.cards.telegram")}
          description={t("security.cards.telegramHint")}
          status={<Badge variant="outline">{t("security.cards.telegramCount", { count: user.telegram.length })}</Badge>}
        />
        <SecurityCard
          href="/security/email/"
          icon={IconMail}
          title={t("security.cards.email")}
          description={user.recovery_email ?? t("security.cards.emailMissing")}
        />
        <SecurityCard
          href="/security/sessions/"
          icon={IconDevices}
          title={t("security.cards.sessions")}
          description={t("security.cards.sessionsHint")}
        />
        <SecurityCard
          href="/security/activity/"
          icon={IconActivity}
          title={t("security.cards.activity")}
          description={t("security.cards.activityHint")}
        />
        {isStudent ? (
          <SecurityCard
            href="/security/emis/"
            icon={IconSchool}
            title={t("security.cards.emis")}
            description={t("security.cards.emisHint")}
            status={
              user.emis_status === "needs_reauth" ? (
                <Badge variant="destructive">{t("security.cards.emisNeedsReauth")}</Badge>
              ) : (
                <Badge variant="secondary">{t("security.cards.emisActive")}</Badge>
              )
            }
          />
        ) : null}
        <SecurityCard
          href="/connectors/"
          icon={IconPlugConnected}
          title={t("security.cards.connectors")}
          description={t("security.cards.connectorsHint")}
        />
        {isStudent ? (
          <SecurityCard
            href="/security/delete/"
            icon={IconTrash}
            destructive
            title={t("security.cards.delete")}
            description={t("security.cards.deleteHint")}
          />
        ) : null}
      </div>
    </div>
  )
}
