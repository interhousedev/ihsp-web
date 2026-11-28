"use client"

import {
  apiAbsoluteUrl,
  clientConfigQuery,
  getMeStudentCardQuery,
  keys,
  postMeStudentCardToken,
  type StudentCard,
} from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { BRAND } from "@ihsp/config/brand"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { studentRecordStatusOf } from "../../shared/hooks/use-student-record-state"
import { cardUrl } from "../utils/card-url"
import type { WalletPlatform } from "../utils/wallet-platform"
import { StudentCardError, retryCardQuery } from "./student-card-error"
import { StudentIdCard } from "./student-id-card"
import { WalletButtons } from "./wallet-buttons"

/**
 * The student card in a bottom sheet (a dialog on a desktop): the ID with the QR code of its permanent token, the
 * wallet buttons and "Regenerate code", which replaces the token after a confirmation.
 */
export function StudentCardSheet({
  open,
  onOpenChange,
  walletPlatform,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Overrides the detected device for the wallet buttons (tests). */
  walletPlatform?: WalletPlatform
}) {
  const t = useT("studentCard")
  const { session } = useSession()
  const queryClient = useQueryClient()
  const card = useQuery({ ...getMeStudentCardQuery(), enabled: open, retry: retryCardQuery })
  const clientConfig = useQuery(clientConfigQuery())
  const logoPath = clientConfig.data?.branding.lyceum_logo_url
  const [confirming, setConfirming] = useState(false)
  const regenerate = useMutation({
    mutationFn: () => postMeStudentCardToken(),
    onSuccess: ({ token }) => {
      queryClient.setQueryData<StudentCard>(keys.me.studentCard(), (current) =>
        current ? { ...current, qr_token: token } : current,
      )
      setConfirming(false)
    },
  })

  const data = card.data

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("title")} size="sm">
      {!data ? (
        card.isError ? (
          studentRecordStatusOf(card.error) === "missing" ? (
            <NoStudentRecordNotice reason="missing" />
          ) : (
            <StudentCardError error={card.error} onRetry={() => void card.refetch()} />
          )
        ) : (
          <StateView state="loading" rows={3} />
        )
      ) : (
        <div className="flex flex-col items-center gap-4">
          <StudentIdCard
            card={data}
            logoSrc={logoPath ? apiAbsoluteUrl(logoPath) : BRAND.lyceumLogo}
            photoUrl={data.has_photo ? (session?.user.photo_url ?? null) : null}
            qrValue={cardUrl(getConfig().SHARE_URL, data.qr_token)}
          />
          <WalletButtons wallet={data.wallet} platform={walletPlatform} />
          <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
            {t("regenerate")}
          </Button>
          {regenerate.isError && !confirming ? (
            <p role="alert" className="text-destructive text-sm">
              {t("regenerateFailed")}
            </p>
          ) : null}
          <ConfirmDialog
            open={confirming}
            onOpenChange={(next) => {
              if (!next) regenerate.reset()
              setConfirming(next)
            }}
            title={t("regenerateTitle")}
            description={t("regenerateDescription")}
            confirmLabel={t("regenerateConfirm")}
            loading={regenerate.isPending}
            onConfirm={() => regenerate.mutate()}
          >
            {regenerate.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {t("regenerateFailed")}
              </p>
            ) : null}
          </ConfirmDialog>
        </div>
      )}
    </ResponsiveDialog>
  )
}
