"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useItems } from "../../items/api"
import { useProfile } from "../../profile/api"
import { useProfileText } from "../../profile/lib/use-profile-text"
import type { EssayLink, PlanSection } from "../api"

const SELECT = "border-input bg-background h-9 rounded-md border px-3 text-sm"
const MAX_SECTIONS = 12
const MAX_LINKS = 20

/** The writer's outline, free notes and links to activities or profile answers the essay draws on. */
export function PlanPane({
  plan,
  notes,
  links,
  onChange,
}: {
  plan: PlanSection[]
  notes: string
  links: EssayLink[]
  onChange: (patch: { plan?: PlanSection[]; notes?: string; links?: EssayLink[] }) => void
}) {
  const t = useT("essays")
  const items = useItems()
  const profile = useProfile()
  const text = useProfileText()
  const [pick, setPick] = useState("")
  const setSection = (i: number, patch: Partial<PlanSection>) =>
    onChange({ plan: plan.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  const itemTitle = new Map((items.data ?? []).map((i) => [i.id, i.title]))
  const answered = Object.entries(profile.data?.answers ?? {})
    .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([id]) => id)
  const linked = new Set(links.map((l) => `${l.kind}:${l.ref}`))
  const label = (l: EssayLink) => (l.kind === "item" ? (itemTitle.get(l.ref) ?? l.ref) : text.label(l.ref))
  return (
    <section className="flex flex-col gap-4" aria-label={t("plan.title")}>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("plan.outline")}</h3>
        {plan.length === 0 ? <p className="text-muted-foreground text-sm">{t("plan.outlineEmpty")}</p> : null}
        <ol className="flex flex-col gap-2">
          {plan.map((s, i) => (
            <li key={i} className="border-hairline flex flex-col gap-1 rounded-card border p-2 animate-in fade-in">
              <div className="flex items-center gap-1">
                <Input
                  aria-label={t("plan.heading", { n: i + 1 })}
                  value={s.heading}
                  maxLength={120}
                  onChange={(e) => setSection(i, { heading: e.target.value })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={t("plan.remove")}
                  onClick={() => onChange({ plan: plan.filter((_, j) => j !== i) })}
                >
                  <Icons.trash aria-hidden />
                </Button>
              </div>
              <Textarea
                aria-label={t("plan.note", { n: i + 1 })}
                rows={2}
                value={s.note}
                onChange={(e) => setSection(i, { note: e.target.value })}
              />
            </li>
          ))}
        </ol>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-start"
          disabled={plan.length >= MAX_SECTIONS}
          onClick={() => onChange({ plan: [...plan, { heading: t("plan.newSection"), note: "" }] })}
        >
          <Icons.add aria-hidden />
          {t("plan.addSection")}
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="essay-notes">{t("plan.notes")}</Label>
        <Textarea id="essay-notes" rows={4} value={notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="essay-link">{t("plan.links")}</Label>
        <div className="flex gap-2">
          <select
            id="essay-link"
            className={`${SELECT} min-w-0 flex-1`}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">{t("plan.linkPick")}</option>
            <optgroup label={t("plan.linkItems")}>
              {(items.data ?? [])
                .filter((i) => !linked.has(`item:${i.id}`))
                .map((i) => (
                  <option key={i.id} value={`item:${i.id}`}>
                    {i.title}
                  </option>
                ))}
            </optgroup>
            <optgroup label={t("plan.linkAnswers")}>
              {answered
                .filter((id) => !linked.has(`profile_answer:${id}`))
                .map((id) => (
                  <option key={id} value={`profile_answer:${id}`}>
                    {text.label(id)}
                  </option>
                ))}
            </optgroup>
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!pick || links.length >= MAX_LINKS}
            onClick={() => {
              const [kind, ref] = pick.split(/:(.*)/s) as [EssayLink["kind"], string]
              onChange({ links: [...links, { kind, ref }] })
              setPick("")
            }}
          >
            {t("plan.link")}
          </Button>
        </div>
        <ul className="flex flex-wrap gap-1">
          {links.map((l) => (
            <li
              key={`${l.kind}:${l.ref}`}
              className="bg-muted flex items-center gap-1 rounded-full py-0.5 pr-1 pl-3 text-xs"
            >
              {label(l)}
              <button
                type="button"
                className="hover:bg-background rounded-full p-0.5"
                aria-label={t("plan.unlink", { name: label(l) })}
                onClick={() => onChange({ links: links.filter((x) => x !== l) })}
              >
                <Icons.close aria-hidden className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
