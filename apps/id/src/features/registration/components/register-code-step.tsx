"use client"

import { readSession, TELEGRAM_INIT_DATA_KEY } from "../../shared/utils/storage"
import {
  postRegisterComplete,
  postRegisterEmail,
  isApiError,
  keys,
  type LegalKind,
  type RegisterCompleteResponse,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, Button } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { acceptedLegalItems, allLegalAccepted, LegalConsentList, useLegalDocuments } from "@ihsp/features-core"
import { CodeStep, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "../../shared/components/flow-card"
import { StepIndicator } from "../../shared/components/step-indicator"

type RegisterCodeStepProps = {
  registrationToken: string
  password: string
  email: string
  confirmImport: boolean
  loginChallenge: string | null
  onBack: () => void
  onCompleted: (response: RegisterCompleteResponse) => void
}

/** Step 3 (UF-ID-01 step 7): the OTP sent to the recovery email, then the account is created. */
export function RegisterCodeStep({
  registrationToken,
  password,
  email,
  confirmImport,
  loginChallenge,
  onBack,
  onCompleted,
}: RegisterCodeStepProps) {
  const t = useTr()
  const tl = useT("legal")
  const queryClient = useQueryClient()
  const documents = useLegalDocuments()
  const published = documents.data?.items ?? []
  const [accepted, setAccepted] = useState<LegalKind[]>([])
  const consentGiven = published.length > 0 && allLegalAccepted(published, accepted)
  const complete = useMutation({
    mutationFn: (code: string) =>
      postRegisterComplete({
        registration_token: registrationToken,
        password,
        email_code: code,
        confirm_import_match: confirmImport ? true : undefined,
        login_challenge: loginChallenge ?? undefined,
        telegram_init_data: readSession(TELEGRAM_INIT_DATA_KEY) ?? undefined,
        accepted_legal: acceptedLegalItems(published, accepted),
      }),
    onSuccess: onCompleted,
    onError: (error) => {
      // A document was published meanwhile: show the fresh list and ask for the consent again.
      if (isApiError(error) && error.type === "legal/consent-required") {
        setAccepted([])
        void queryClient.invalidateQueries({ queryKey: keys.legal.all() })
      }
    },
  })
  const resend = useMutation({ mutationFn: () => postRegisterEmail({ registration_token: registrationToken, email }) })

  return (
    <FlowCard title={t("register.code.title")} description={t("register.code.description", { email })}>
      <StepIndicator current={3} total={3} />
      <CodeStep
        submitLabel={t("register.code.submit")}
        pending={complete.isPending}
        error={complete.error ?? resend.error}
        onSubmit={(code) => complete.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
        disabled={!consentGiven}
      >
        {documents.isError ? <Alert variant="destructive">{tl("consent.loadFailed")}</Alert> : null}
        {published.length > 0 ? (
          <LegalConsentList documents={published} accepted={accepted} onChange={setAccepted} />
        ) : null}
      </CodeStep>
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("register.code.changeEmail")}
      </Button>
    </FlowCard>
  )
}
