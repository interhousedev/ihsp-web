"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Pill, PillIndicator } from "@ihsp/ui"
import type { AiRisk, Profession } from "../api"
import { exposurePct } from "../model"

const RISK_TONE = { low: "success", medium: "warning", high: "danger" } as const satisfies Record<AiRisk, string>

/** The AI-exposure badge: the band and the scenario horizon, never a year. */
export function RiskBadge({ profession }: { profession: Profession }) {
  const t = useT("professions")
  return (
    <Pill tone={RISK_TONE[profession.ai_risk]} className="h-auto max-w-full py-0.5 text-start whitespace-normal">
      <PillIndicator tone={RISK_TONE[profession.ai_risk]} />
      {t(`risk.${profession.ai_risk}`)} · {t(`horizon.${profession.horizon}`)}
    </Pill>
  )
}

/** The one honest line about the number behind the badge. */
export function ExposureNote({ profession }: { profession?: Profession }) {
  const t = useT("professions")
  return (
    <p className="text-muted-foreground text-xs leading-snug">
      {profession ? `${t("exposure.share", { pct: exposurePct(profession.ai_exposure) })} ` : ""}
      {t("exposure.note")}
    </p>
  )
}

export function ProfessionCard({
  profession,
  picked,
  full,
  fieldLabel,
  onAdd,
}: {
  profession: Profession
  picked: boolean
  full: boolean
  fieldLabel: (key: string) => string
  onAdd: () => void
}) {
  const t = useT("professions")
  return (
    <li className="bg-card rounded-card flex min-w-0 flex-col gap-1.5 border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{profession.name}</p>
          <p className="text-muted-foreground text-xs">{profession.group}</p>
        </div>
        {profession.custom ? <Pill>{t("custom.badge")}</Pill> : null}
        <Button
          type="button"
          size="sm"
          variant={picked ? "secondary" : "outline"}
          disabled={picked || full}
          onClick={onAdd}
          aria-label={t("card.addLabel", { name: profession.name })}
        >
          {picked ? <Icons.check aria-hidden className="size-4" /> : <Icons.add aria-hidden className="size-4" />}
          {picked ? t("card.picked") : t("card.add")}
        </Button>
      </div>
      {profession.description ? <p className="text-sm leading-snug">{profession.description}</p> : null}
      <div className="flex flex-wrap items-center gap-1.5">
        <RiskBadge profession={profession} />
        {profession.salary_band ? (
          <Pill>{t("salary.label", { band: t(`salary.${profession.salary_band}`) })}</Pill>
        ) : null}
      </div>
      {profession.related_fields.length > 0 ? (
        <p className="text-muted-foreground text-xs">
          {t("card.fields")}: {profession.related_fields.map(fieldLabel).join(", ")}
        </p>
      ) : null}
    </li>
  )
}
