"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Button, Icons, Label } from "@ihsp/ui"
import { useState } from "react"
import { useAffordability } from "../hooks"
import { useWorkflow } from "../../../lib/config"
import type { ListEntry } from "../types"
import { useOptionLabel } from "./option-label"
import { formatCurrency } from "./money"

/** Affordability of one list entry: the check, and for a binding round that does not fit, the sign-off request. */
export function AffordabilityPanel({ entry }: { entry: ListEntry }) {
  const t = useT("chooser")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const statusLabel = useOptionLabel("affordability")
  const workflow = useWorkflow()
  const { check, signOff } = useAffordability()
  const [acknowledged, setAcknowledged] = useState(false)
  const result = signOff.data ?? check.data ?? entry.affordability
  const status = result?.status ?? entry.affordability_status
  const currency = entry.institution.coa_currency
  const binding = workflow.rounds.some((round) => round.id === entry.round && round.binding)
  const signedOffAt = result?.signed_off_at ?? null
  const needsSignOff =
    binding && (status === "signed_off" || (status !== null && workflow.affordability_ack_statuses.includes(status)))
  const requestedAt = result?.requested_sign_off_at ?? null
  const error = check.error ?? signOff.error
  const money = (value: string | null) => (value === null ? "—" : (formatCurrency(value, currency, locale) ?? value))

  return (
    <section className="flex flex-col gap-3" aria-label={t("afford.title")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={check.isPending}
          onClick={() => check.mutate(entry.id)}
        >
          <Icons.billing aria-hidden />
          {t("afford.check")}
        </Button>
        {status ? (
          <span className="text-sm font-medium">{statusLabel(status)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">{t("afford.notChecked")}</span>
        )}
      </div>
      {result ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {(
            [
              ["coa", result.coa_total],
              ["confirmedAid", result.confirmed_aid],
              ["estimatedAid", result.estimated_aid],
              ["gap", result.gap],
            ] as const
          ).map(([key, value]) => (
            <div key={key}>
              <dt className="text-muted-foreground text-xs">{t(`afford.${key}`)}</dt>
              <dd>{money(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {needsSignOff && (signedOffAt || status === "signed_off") ? (
        <p className="text-success flex items-center gap-1 text-sm">
          <Icons.badgeCheck className="size-4" aria-hidden />
          {t("afford.signedOff")}
        </p>
      ) : null}
      {needsSignOff && requestedAt && !signedOffAt && status !== "signed_off" ? (
        <p className="text-muted-foreground flex items-center gap-1 text-sm" role="status">
          <Icons.clock className="size-4" aria-hidden />
          {t("afford.waiting")}
        </p>
      ) : null}
      {needsSignOff && !requestedAt && !signedOffAt && status !== "signed_off" ? (
        <Alert variant="destructive">
          <Icons.warning aria-hidden />
          <AlertTitle>{t("afford.bindingTitle", { round: entry.round })}</AlertTitle>
          <AlertDescription>
            <p>{t("afford.bindingText")}</p>
            <div className="flex items-center gap-2 pt-2">
              <input
                id={`ack-${entry.id}`}
                type="checkbox"
                className="size-4"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <Label htmlFor={`ack-${entry.id}`}>{t("afford.acknowledge")}</Label>
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              disabled={!acknowledged || signOff.isPending}
              onClick={() => signOff.mutate(entry.id)}
            >
              {t("afford.requestSignOff")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(error)}
        </p>
      ) : null}
    </section>
  )
}
