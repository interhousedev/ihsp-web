"use client"

import { getMeStudentCardQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { TeacherAvatar } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import { QrCode, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useCardToken } from "../hooks/use-card-token"
import { cardUrl } from "../utils/card-url"

/** The student card in a bottom sheet (a dialog on a desktop) with a QR code of a token that renews while it is open. */
export function StudentCardSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("studentCard")
  const locale = useLocale() as "uz" | "ru" | "en"
  const { session } = useSession()
  const card = useQuery({ ...getMeStudentCardQuery(), enabled: open })
  const qr = useCardToken(open)

  const data = card.data
  const name = data ? `${data.first_name} ${data.last_name}`.trim() : ""
  const facts: [string, string | number | null][] = data
    ? [
        [t("group"), data.group],
        [t("course"), data.course],
        [t("direction"), data.direction],
        [t("speciality"), data.speciality],
      ]
    : []

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("title")} size="sm">
      {!data ? (
        <StateView
          state={card.isError ? "error" : "loading"}
          error={card.error}
          onRetry={() => void card.refetch()}
          rows={3}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <TeacherAvatar name={name} photoUrl={data.has_photo ? (session?.user.photo_url ?? null) : null} size="lg" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xl font-semibold">{data.first_name}</p>
            <p className="text-xl font-semibold">{data.last_name}</p>
            {data.lyceum_name ? (
              <p className="text-muted-foreground text-sm">{data.lyceum_name[locale] ?? data.lyceum_name.en}</p>
            ) : null}
          </div>
          <dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-left text-sm">
            {facts
              .filter(([, value]) => value !== null && value !== "")
              .map(([label, value]) => (
                <div key={label} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>
          <div className="flex flex-col items-center gap-2">
            {qr.token ? (
              <div
                data-testid="card-qr"
                data-stale={qr.failed}
                className={qr.failed ? "opacity-30" : undefined}
                data-card-url={cardUrl(getConfig().SHARE_URL, qr.token)}
              >
                <QrCode value={cardUrl(getConfig().SHARE_URL, qr.token)} label={t("qrLabel")} />
              </div>
            ) : (
              <StateView state="loading" rows={1} />
            )}
            {qr.failed ? (
              <p role="alert" className="text-destructive text-sm">
                {t("qrFailed")}
              </p>
            ) : null}
            <p role="timer" aria-live="off" className="text-muted-foreground text-sm">
              {t("refreshIn", { seconds: qr.secondsLeft })}
            </p>
          </div>
        </div>
      )}
    </ResponsiveDialog>
  )
}
