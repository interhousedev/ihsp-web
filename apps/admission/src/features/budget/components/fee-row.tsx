"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { SourceChip } from "../../chooser/components/fact-source"
import { formatCurrency } from "../../chooser/components/money"
import { useFeeStatus } from "../hooks"
import { FEE_STATUSES, type BudgetRow, type FeeStatus } from "../types"

const SELECT =
  "border-input bg-background h-11 rounded-lg border px-2.5 text-sm md:h-9 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

/** One list entry of "Cost to apply": logo, round, fee with its source, fee status, aid forms and the aid deadline. */
export function FeeRow({ row }: { row: BudgetRow }) {
  const t = useT("budget")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const feeStatus = useFeeStatus()
  const fee = row.application_fee
  return (
    <li className="bg-card border-hairline-strong rounded-card flex min-w-0 flex-col gap-3 border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <LogoAvatar
          name={row.institution.name}
          src={row.institution.logo_url}
          fit={row.institution.logo_fit}
          zoom={row.institution.logo_zoom}
          className="size-10 ring-0"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/chooser/institution/?id=${encodeURIComponent(row.institution.id)}`}
            className="font-medium hover:underline"
          >
            {row.institution.name}
          </Link>
          <p className="text-muted-foreground text-xs">{row.round}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {fee ? (
          <>
            <span className="text-sm font-semibold">
              {formatCurrency(fee.amount, fee.currency, locale) ?? fee.amount}
            </span>
            <SourceChip url={fee.source_url} year={fee.year} />
          </>
        ) : (
          <span className="text-muted-foreground text-sm">{t("feeUnknown")}</span>
        )}
        <select
          aria-label={t("statusFor", { name: row.institution.name })}
          className={SELECT}
          value={row.fee_status}
          disabled={feeStatus.isPending}
          onChange={(event) => feeStatus.mutate({ entryId: row.entry_id, status: event.target.value as FeeStatus })}
        >
          {FEE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </div>
      {feeStatus.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(feeStatus.error)}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {row.aid_forms_known ? (
          row.aid_forms.length ? (
            <ul className="flex flex-wrap gap-2" aria-label={t("aidForms")}>
              {row.aid_forms.map((form) => (
                <li key={form} className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">
                  {t(`form.${form}`)}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">{t("noAidForms")}</span>
          )
        ) : (
          <span className="text-muted-foreground">{t("aidFormsUnknown")}</span>
        )}
        {row.aid_deadline ? (
          <span className="text-muted-foreground">
            {t("aidDeadline", { date: new Date(row.aid_deadline).toLocaleDateString(locale) })}
          </span>
        ) : null}
      </div>
    </li>
  )
}
