"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, Label, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useEffect, useState } from "react"
import type { Club, FormFieldDef, JoinPolicy, MemberView } from "../api/activities-api"
import {
  useClubEvents,
  useClubFormFields,
  useCreateEvent,
  useFormAnswers,
  usePatchClub,
  usePointsActions,
  usePointsRules,
  useSaveFormFields,
  useTransferAnswer,
  useIncomingTransfers,
} from "../use-activities"
import { SELECT_CLASS, Section } from "./activity-ui"

const POLICIES: JoinPolicy[] = ["open", "request", "invite"]
const FIELD_TYPES = ["text", "choice", "number", "bool"] as const
const KIND_KEY: Record<(typeof FIELD_TYPES)[number], "text" | "chips" | "number" | "bool"> = {
  text: "text",
  choice: "chips",
  number: "number",
  bool: "bool",
}

function Failure({ error }: { error: unknown }) {
  const errorMessage = useErrorMessage()
  return error ? (
    <p role="alert" className="text-destructive text-sm">
      {errorMessage(error)}
    </p>
  ) : null
}

/** The club's own page (description, goals, rules, schedule, partners, how people join): saved by the owner. */
export function ClubProfileEditor({ clubId, club }: { clubId: string; club: Club }) {
  const t = useT("activities")
  const common = useT("common")
  const patch = usePatchClub(clubId)
  const [v, setV] = useState({
    name: "",
    description: "",
    category: "",
    goals: "",
    rules: "",
    schedule: "",
    partners: "",
    join_policy: "request" as JoinPolicy,
  })
  useEffect(() => {
    setV({
      name: club.name,
      description: club.description ?? "",
      category: club.category ?? "",
      goals: club.goals ?? "",
      rules: club.rules ?? "",
      schedule: club.schedule ?? "",
      partners: (club.partners ?? []).join("\n"),
      join_policy: club.join_policy ?? "request",
    })
  }, [club])
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [key]: e.target.value }))
  return (
    <Card>
      <CardContent className="grid gap-4">
        <h3 className="font-semibold">{t("profile.title")}</h3>
        <div className="grid gap-1.5">
          <Label>{t("profile.name")}</Label>
          <input className={SELECT_CLASS} maxLength={120} value={v.name} onChange={set("name")} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t("profile.category")}</Label>
          <input className={SELECT_CLASS} maxLength={40} value={v.category} onChange={set("category")} />
        </div>
        {(["description", "goals", "rules", "schedule"] as const).map((key) => (
          <div key={key} className="grid gap-1.5">
            <Label>{t(`profile.${key}`)}</Label>
            <Textarea rows={3} maxLength={4000} value={v[key]} onChange={set(key)} />
          </div>
        ))}
        <div className="grid gap-1.5">
          <Label>{t("profile.partners")}</Label>
          <Textarea rows={3} value={v.partners} onChange={set("partners")} />
          <p className="text-muted-foreground text-xs">{t("profile.partnersHint")}</p>
        </div>
        <div className="grid gap-1.5">
          <Label>{t("profile.joinPolicy")}</Label>
          <select className={SELECT_CLASS} value={v.join_policy} onChange={set("join_policy")}>
            {POLICIES.map((p) => (
              <option key={p} value={p}>
                {t(`joinPolicies.${p}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={patch.isPending || !v.name.trim()}
            onClick={() =>
              patch.mutate({
                name: v.name.trim(),
                description: v.description,
                category: v.category.trim() || null,
                goals: v.goals,
                rules: v.rules,
                schedule: v.schedule,
                partners: v.partners
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean),
                join_policy: v.join_policy,
              })
            }
          >
            {common("save")}
          </Button>
          {patch.isSuccess ? (
            <span role="status" className="text-sm">
              {common("saved")}
            </span>
          ) : null}
        </div>
        <Failure error={patch.error} />
      </CardContent>
    </Card>
  )
}

const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50)

/** Definition of the member form (`/clubs/{id}/form-fields`) and the answers members gave. */
export function FormBuilder({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const common = useT("common")
  const fmt = useFormatters()
  const defs = useClubFormFields(clubId)
  const answers = useFormAnswers(clubId, true)
  const save = useSaveFormFields(clubId)
  const [fields, setFields] = useState<FormFieldDef[]>([])
  const [label, setLabel] = useState("")
  const [type, setType] = useState<(typeof FIELD_TYPES)[number]>("text")
  const [options, setOptions] = useState("")
  useEffect(() => setFields(defs.data?.fields ?? []), [defs.data])
  const add = () => {
    const name = label.trim()
    if (!name) return
    let key = slug(name) || `field_${fields.length + 1}`
    while (fields.some((f) => f.key === key)) key += "_2"
    const opts =
      type === "choice"
        ? options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined
    setFields([...fields, { key, label: name, type, ...(opts ? { options: opts } : {}) }])
    setLabel("")
    setOptions("")
  }
  const rows = answers.data?.items ?? []
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3">
          <h3 className="font-semibold">{t("formsAdmin.title")}</h3>
          <ul className="grid gap-2">
            {fields.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {f.label ?? f.key} ·{" "}
                  <span className="text-muted-foreground">
                    {t(`formsAdmin.kind.${KIND_KEY[(f.type as (typeof FIELD_TYPES)[number]) ?? "text"] ?? "text"}`)}
                  </span>
                  {f.options?.length ? <span className="text-muted-foreground"> · {f.options.join(", ")}</span> : null}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFields(fields.filter((x) => x.key !== f.key))}
                >
                  {t("formsAdmin.delete")}
                </Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 md:grid-cols-[1fr_10rem]">
            <input
              className={SELECT_CLASS}
              placeholder={t("formsAdmin.newField")}
              value={label}
              maxLength={120}
              onChange={(e) => setLabel(e.target.value)}
            />
            <select
              className={SELECT_CLASS}
              value={type}
              aria-label={t("formsAdmin.fieldType")}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              {FIELD_TYPES.map((k) => (
                <option key={k} value={k}>
                  {t(`formsAdmin.kind.${KIND_KEY[k]}`)}
                </option>
              ))}
            </select>
          </div>
          {type === "choice" ? (
            <div className="grid gap-1.5">
              <input
                className={SELECT_CLASS}
                placeholder={t("formsAdmin.options")}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t("formsAdmin.optionsHint")}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={!label.trim()} onClick={add}>
              {t("formsAdmin.add")}
            </Button>
            <Button type="button" disabled={save.isPending} onClick={() => save.mutate(fields)}>
              {common("save")}
            </Button>
            {save.isSuccess ? (
              <span role="status" className="text-sm">
                {common("saved")}
              </span>
            ) : null}
          </div>
          <Failure error={save.error} />
        </CardContent>
      </Card>
      <Section title={t("formsAdmin.answersTitle")}>
        {rows.length === 0 ? <p className="text-muted-foreground text-sm">{t("formsAdmin.noAnswers")}</p> : null}
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.user_id}>
              <Card>
                <CardContent className="grid gap-1 text-sm">
                  <p className="font-medium">
                    {r.display_name}{" "}
                    <span className="text-muted-foreground font-normal">· {fmt.dateTime(r.updated_at)}</span>
                  </p>
                  {Object.entries(r.answers).map(([k, value]) => {
                    const def = fields.find((f) => f.key === k)
                    return (
                      <p key={k}>
                        <span className="text-muted-foreground">{def?.label ?? t(`form.${k}` as never)}: </span>
                        {typeof value === "boolean" ? (value ? "✓" : "–") : String(value ?? "")}
                      </p>
                    )
                  })}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

/** Stored as negative; shown as the positive magnitude of the penalty. */
const RULES = [
  { key: "attended", label: "attend", sign: 1 },
  { key: "volunteered", label: "shift", sign: 1 },
  { key: "organized", label: "event", sign: 1 },
  { key: "no_show", label: "noShow", sign: -1 },
] as const

/** Points per action and manual awards. */
export function PointsAdmin({ clubId, members }: { clubId: string; members: MemberView[] }) {
  const t = useT("activities")
  const rules = usePointsRules(clubId)
  const { saveRules, award } = usePointsActions(clubId)
  const [values, setValues] = useState<Record<string, string>>({})
  const [invalid, setInvalid] = useState(false)
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  useEffect(() => {
    const r = rules.data?.rules ?? {}
    setValues(Object.fromEntries(RULES.map((x) => [x.key, r[x.key] !== undefined ? String(Math.abs(r[x.key])) : ""])))
  }, [rules.data])
  const submitRules = () => {
    const next: Record<string, number> = { ...rules.data?.rules }
    for (const rule of RULES) {
      const n = Number(values[rule.key])
      if (values[rule.key] === "" || !Number.isFinite(n) || n < 0) {
        setInvalid(true)
        return
      }
      next[rule.key] = rule.sign * Math.trunc(n)
    }
    setInvalid(false)
    saveRules.mutate(next)
  }
  const pts = Number(amount)
  const active = members.filter((m) => m.status === "active")
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3">
          <h3 className="font-semibold">{t("pointsAdmin.title")}</h3>
          {RULES.map((rule) => (
            <label key={rule.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{t(`pointsAdmin.${rule.label}`)}</span>
              <span className="flex items-center gap-1">
                {rule.sign < 0 ? "−" : "+"}
                <input
                  type="number"
                  min={0}
                  className={`${SELECT_CLASS} w-24`}
                  value={values[rule.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [rule.key]: e.target.value }))}
                />
              </span>
            </label>
          ))}
          {invalid ? (
            <p role="alert" className="text-destructive text-sm">
              {t("pointsAdmin.invalidRule")}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <Button type="button" className="w-fit" disabled={saveRules.isPending} onClick={submitRules}>
              {t("pointsAdmin.save")}
            </Button>
            {saveRules.isSuccess ? (
              <span role="status" className="text-sm">
                {t("pointsAdmin.saved")}
              </span>
            ) : null}
          </div>
          <Failure error={saveRules.error} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3">
          <h3 className="font-semibold">{t("pointsAdmin.manualTitle")}</h3>
          <select
            className={SELECT_CLASS}
            value={userId}
            aria-label={t("pointsAdmin.member")}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">{t("pointsAdmin.member")}</option>
            {active.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className={SELECT_CLASS}
            placeholder={t("pointsAdmin.amount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className={SELECT_CLASS}
            placeholder={t("pointsAdmin.reason")}
            value={reason}
            maxLength={200}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            type="button"
            className="w-fit"
            disabled={!userId || !Number.isInteger(pts) || pts === 0 || !reason.trim() || award.isPending}
            onClick={() =>
              award.mutate(
                { user_id: userId, points: pts, reason: reason.trim() },
                {
                  onSuccess: () => {
                    setAmount("")
                    setReason("")
                  },
                },
              )
            }
          >
            {t("pointsAdmin.award")}
          </Button>
          <Failure error={award.error} />
        </CardContent>
      </Card>
    </div>
  )
}

/** Club events and the form that adds one. */
export function EventsAdmin({ clubId }: { clubId: string }) {
  const t = useT("activities")
  const fmt = useFormatters()
  const list = useClubEvents(clubId)
  const create = useCreateEvent(clubId)
  const [v, setV] = useState({ title: "", starts: "", ends: "", location: "", capacity: "" })
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [key]: e.target.value }))
  const ok = v.title.trim() !== "" && v.starts !== "" && v.ends !== "" && new Date(v.ends) > new Date(v.starts)
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3">
          <h3 className="font-semibold">{t("eventsAdmin.title")}</h3>
          <input
            className={SELECT_CLASS}
            placeholder={t("eventsAdmin.name")}
            maxLength={200}
            value={v.title}
            onChange={set("title")}
          />
          <div className="grid gap-2 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              {t("eventsAdmin.starts")}
              <input type="datetime-local" className={SELECT_CLASS} value={v.starts} onChange={set("starts")} />
            </label>
            <label className="grid gap-1 text-sm">
              {t("eventsAdmin.ends")}
              <input type="datetime-local" className={SELECT_CLASS} value={v.ends} onChange={set("ends")} />
            </label>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className={SELECT_CLASS}
              placeholder={t("eventsAdmin.location")}
              value={v.location}
              onChange={set("location")}
            />
            <input
              type="number"
              min={1}
              className={SELECT_CLASS}
              placeholder={t("eventsAdmin.capacity")}
              value={v.capacity}
              onChange={set("capacity")}
            />
          </div>
          <Button
            type="button"
            className="w-fit"
            disabled={!ok || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  title: v.title.trim(),
                  description: "",
                  starts_at: new Date(v.starts).toISOString(),
                  ends_at: new Date(v.ends).toISOString(),
                  location: v.location.trim() || null,
                  capacity: v.capacity ? Number(v.capacity) : null,
                },
                { onSuccess: () => setV({ title: "", starts: "", ends: "", location: "", capacity: "" }) },
              )
            }
          >
            {t("eventsAdmin.create")}
          </Button>
          <Failure error={create.error} />
        </CardContent>
      </Card>
      <ul className="grid gap-2">
        {(list.data?.items ?? []).map((e) => (
          <li key={e.id}>
            <Card>
              <CardContent className="text-sm">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground">{fmt.dateTime(e.starts_at)}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The offer of club ownership: opened from a notification (`?transfer=<id>`) or found among the caller's pending offers. */
export function TransferDialog({
  clubId,
  clubName,
  transferId,
}: {
  clubId: string
  clubName: string
  transferId: string | null
}) {
  const t = useT("activities")
  const incoming = useIncomingTransfers()
  const { accept, decline } = useTransferAnswer()
  const [closed, setClosed] = useState(false)
  const pending = (incoming.data ?? []).find((x) => x.club_id === clubId && (!transferId || x.id === transferId))
  const id = transferId ?? pending?.id ?? null
  const answered = accept.isSuccess || decline.isSuccess
  const open = !closed && id !== null && (answered || pending !== undefined || transferId !== null)
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && setClosed(true)}
      title={t("transferOffer.title", { name: clubName })}
      description={
        answered
          ? accept.isSuccess
            ? t("transferOffer.accepted")
            : t("transferOffer.declined")
          : t("transferOffer.body")
      }
      footer={
        answered ? (
          <Button type="button" onClick={() => setClosed(true)}>
            {t("transferOffer.close")}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={decline.isPending || accept.isPending}
              onClick={() => id && decline.mutate(id)}
            >
              {t("draft.decline")}
            </Button>
            <Button
              type="button"
              disabled={decline.isPending || accept.isPending}
              onClick={() => id && accept.mutate(id)}
            >
              {t("approve")}
            </Button>
          </>
        )
      }
    >
      <Failure error={accept.error ?? decline.error} />
    </ResponsiveDialog>
  )
}
