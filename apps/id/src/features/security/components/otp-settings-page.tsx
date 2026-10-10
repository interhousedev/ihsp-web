"use client"

import { getIdMeQuery } from "@ihsp/api"
import { Alert, AlertDescription, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { useUpdateMe } from "../hooks/use-update-me"
import { OtpDisableForm } from "./otp-disable-form"
import { OtpEnableForm } from "./otp-enable-form"

/** `/security/otp/` (UF-ID-06): enable or disable OTP login. */
export function OtpSettingsPage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  const updateMe = useUpdateMe()

  return (
    <PageContainer title={t("security.otp.title")}>
      <QueryBoundary query={me}>
        {(user) =>
          user.otp_enabled ? (
            <div className="grid gap-4">
              <Alert>
                <AlertDescription>
                  {user.otp_via_email ? t("security.otp.enabledWithEmail") : t("security.otp.enabled")}
                </AlertDescription>
              </Alert>
              <OtpDisableForm onDisabled={updateMe} />
            </div>
          ) : (
            <OtpEnableForm user={user} onEnabled={updateMe} />
          )
        }
      </QueryBoundary>
    </PageContainer>
  )
}
