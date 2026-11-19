"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Button, buttonVariants } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { consentKeys, putConsent } from "../consent/api"

/** Shown in place of the composer when the assistant answers `consent_required`: grant the AI purpose and retry. */
export function AssistantConsentCard({ retry }: { retry: () => void }) {
  const t = useT("assistantDock")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const grant = useMutation({
    mutationFn: () => putConsent(["admission_ai"]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: consentKeys.consent() })
      retry()
    },
  })
  return (
    <Alert data-testid="assistant-consent">
      <AlertTitle>{t("consent.title")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>{t("consent.text")}</span>
        {grant.error ? (
          <span role="alert" className="text-destructive">
            {errorMessage(grant.error)}
          </span>
        ) : null}
        <span className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11 md:min-h-8"
            disabled={grant.isPending}
            onClick={() => grant.mutate()}
          >
            {t("consent.allow")}
          </Button>
          <Link href="/settings/#consent" className={buttonVariants({ variant: "outline" })}>
            {t("consent.settings")}
          </Link>
        </span>
      </AlertDescription>
    </Alert>
  )
}
