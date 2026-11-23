"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Label,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
} from "@ihsp/ui"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { ImageUrlField } from "../../../components/lib/image-url-field"
import { InstitutionCombobox } from "../../chooser/components/institution-combobox"
import { useInstitution } from "../../chooser/hooks"
import type { Institution } from "../../chooser/types"
import { useCreateProposal, useFactSpec, type ProposalKind } from "../api"
import { buildFacts, EMPTY_FACTS, factsFromRows, isHttpsUrl, type FactsState } from "../fact-draft"
import { FactsStep, type FactError } from "./facts-step"

/** Empty is fine (the field is optional); anything else must be an https URL. */
function isHttps(value: string): boolean {
  return value.trim() === "" || isHttpsUrl(value)
}

const COUNTRY_CODE = /^[A-Za-z]{2}$/
const KINDS: ProposalKind[] = ["institution", "scholarship"]
const PROVIDERS = ["institution", "government", "foundation"] as const
const BASES = ["merit", "need", "government", "sports", "work_study"] as const
const REASONS = ["unknown_key", "value", "source_url", "year", "note", "text", "kind"] as const

type Problem =
  | { type: "fact"; fact: string; reason: string }
  | {
      type: "duplicate"
      institutionId: string | null
      proposalId: string | null
    }
  | { type: "limit"; limit: string }

function readProblem(error: unknown): Problem | null {
  if (!isApiError(error)) return null
  const { params } = error
  if (error.type === "admission/catalog_fact_invalid") {
    return {
      type: "fact",
      fact: String(params.fact ?? ""),
      reason: String(params.reason ?? ""),
    }
  }
  if (error.type === "admission/catalog_duplicate") {
    return {
      type: "duplicate",
      institutionId: typeof params.institution_id === "string" ? params.institution_id : null,
      proposalId: typeof params.proposal_id === "string" ? params.proposal_id : null,
    }
  }
  if (error.type === "admission/catalog_proposal_limit") return { type: "limit", limit: String(params.limit ?? "") }
  return null
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-muted-foreground text-[13px] font-normal">
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

function ProblemAlert({ problem }: { problem: Problem }) {
  const t = useT("catalogFacts")
  const reasonText = useReasonText()
  return (
    <p role="alert" className="text-destructive rounded-card border border-destructive/30 p-2 text-sm">
      {problem.type === "fact" && t("factInvalid", { reason: reasonText(problem.reason) })}
      {problem.type === "limit" && t("limit", { limit: problem.limit })}
      {problem.type === "duplicate" && problem.institutionId && (
        <>
          {t("duplicateInstitution")}{" "}
          <Link className="underline" href={`/chooser/institution/?id=${encodeURIComponent(problem.institutionId)}`}>
            {t("openInstitution")}
          </Link>
        </>
      )}
      {problem.type === "duplicate" && !problem.institutionId && (
        <>
          {t("duplicatePending")}{" "}
          <Link className="underline" href="/staff/catalog/">
            {t("openPending")}
          </Link>
        </>
      )}
    </p>
  )
}

/** The translated reasons of `admission/catalog_fact_invalid`; an unknown reason is shown as sent. */
function useReasonText(): (reason: string) => string {
  const t = useT("catalogFacts")
  const texts: Record<string, string> = Object.fromEntries(REASONS.map((reason) => [reason, t(`reason.${reason}`)]))
  return (reason) => texts[reason] ?? reason
}

/** POST /staff/catalog/proposals: pick the target, then fill the details and the cited facts. */
export function ProposeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("catalogStaff")
  const tf = useT("catalogFacts")
  const u = useT("settingsUx")
  const errorMessage = useErrorMessage()
  const create = useCreateProposal()
  const spec = useFactSpec()
  const reasonText = useReasonText()
  const [step, setStep] = useState<"target" | "details">("target")
  const [kind, setKind] = useState<ProposalKind>("institution")
  const [target, setTarget] = useState<Institution | null>(null)
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [domain, setDomain] = useState("")
  const [aliases, setAliases] = useState<string[]>([])
  const [provider, setProvider] = useState<string>(PROVIDERS[0])
  const [basis, setBasis] = useState<string>(BASES[0])
  const [sourceUrl, setSourceUrl] = useState("")
  const [note, setNote] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [facts, setFacts] = useState<FactsState>(EMPTY_FACTS)
  const [baseline, setBaseline] = useState<FactsState>(EMPTY_FACTS)
  const [seededFor, setSeededFor] = useState<string | null>(null)
  const detail = useInstitution(kind === "institution" ? (target?.id ?? null) : null)
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)

  const groups = kind === "institution" ? (spec.data?.groups ?? []) : []
  if (target && detail.data?.id === target.id && spec.data && seededFor !== target.id) {
    const seeded = factsFromRows(
      spec.data.groups,
      detail.data.details.flatMap((group) => group.rows),
    )
    setSeededFor(target.id)
    setFacts(seeded)
    setBaseline(seeded)
  }
  const built = buildFacts(groups, facts, baseline)
  const factCount = Object.keys(built.facts).length
  const aliasList = aliases

  const fields: Record<string, unknown> =
    kind === "institution"
      ? {
          name,
          country: country.toUpperCase(),
          city,
          website_domain: domain.trim(),
          aliases: aliasList.length > 0 ? aliasList : "",
          logo_url: logoUrl.trim(),
          cover_url: coverUrl.trim(),
        }
      : { name, provider, basis, country: country.toUpperCase() }
  const current: Record<string, unknown> = target
    ? {
        name: target.name,
        country: COUNTRY_CODE.test(target.country) ? target.country.toUpperCase() : "",
        city: target.city ?? "",
        aliases: target.aliases.length > 0 ? target.aliases : "",
        logo_url: target.logo_url ?? "",
        cover_url: target.cover_url ?? "",
      }
    : {}
  const changed = Object.fromEntries(
    Object.entries(fields).filter(
      ([key, value]) => value !== "" && JSON.stringify(value) !== JSON.stringify(current[key]),
    ),
  )
  const filled = Object.keys(changed).length > 0
  const firstFact = Object.values(built.facts)[0]
  const proposalSource = sourceUrl.trim() || firstFact?.source_url || ""
  const mediaValid = kind !== "institution" || (isHttps(logoUrl) && isHttps(coverUrl))
  const ready =
    mediaValid &&
    (filled || factCount > 0) &&
    built.incomplete.length === 0 &&
    isHttpsUrl(proposalSource) &&
    (kind !== "institution" || target !== null || name.trim() !== "")

  function pickTarget(institution: Institution | null) {
    setTarget(institution)
    setName(institution?.name ?? "")
    setCountry(institution && COUNTRY_CODE.test(institution.country) ? institution.country : "")
    setFacts(EMPTY_FACTS)
    setBaseline(EMPTY_FACTS)
    setSeededFor(null)
    setCity(institution?.city ?? "")
    setAliases(institution?.aliases ?? [])
    setLogoUrl(institution?.logo_url ?? "")
    setCoverUrl(institution?.cover_url ?? "")
    setProblem(null)
  }

  function startNewSchool(query: string) {
    pickTarget(null)
    setName(query.trim())
    setStep("details")
  }

  function back() {
    setProblem(null)
    setName("")
    setStep("target")
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (step === "target") {
      if (kind === "scholarship" || target) setStep("details")
      return
    }
    const clean = changed
    setProblem(null)
    try {
      await create.mutateAsync({
        kind,
        target_id: kind === "institution" ? (target?.id ?? null) : null,
        fields: clean,
        source_url: proposalSource,
        note: note.trim() || null,
        ...(factCount > 0 ? { facts: built.facts } : {}),
      })
      toast.success(t("sent"))
      onOpenChange(false)
    } catch (error) {
      const known = readProblem(error)
      if (!known) {
        toast.error(errorMessage(error))
        return
      }
      setProblem(known)
      if (known.type !== "fact") return
      const owner = groups.find((group) => group.facts.some((item) => item.key === known.fact))
      if (owner) setOpenGroups((current) => (current.includes(owner.key) ? current : [...current, owner.key]))
    }
  }

  const factError: FactError | null = problem?.type === "fact" ? { fact: problem.fact, reason: problem.reason } : null
  const picking = step === "target"

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("proposeTitle")}
      onSubmit={submit}
      size="lg"
      footer={
        picking ? (
          <Button type="submit" disabled={kind === "institution" && target === null}>
            {tf("next")}
          </Button>
        ) : (
          <>
            {!ready && (
              <p id="cp-required-hint" className="text-muted-foreground mr-auto self-center text-xs">
                {t("requiredHint")}
              </p>
            )}
            <LoadingButton
              type="submit"
              disabled={!ready}
              loading={create.isPending}
              aria-describedby={!ready ? "cp-required-hint" : undefined}
            >
              {t("submit")}
            </LoadingButton>
          </>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {picking ? (
          <>
            <Select
              value={kind}
              onValueChange={(value) => {
                if (!value) return
                setKind(value as ProposalKind)
                pickTarget(null)
              }}
            >
              <SelectTrigger aria-label={t("kindLabel")} className="min-h-11 w-full md:min-h-8">
                <SelectValue>{t(`kind.${kind}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`kind.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kind === "institution" && (
              <InstitutionCombobox
                id="catalog-target"
                value={target}
                onChange={pickTarget}
                onAddSchool={startNewSchool}
              />
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={back}
              className="text-muted-foreground flex min-h-9 items-center gap-1 self-start text-sm md:min-h-7"
            >
              <Icons.chevronLeft className="size-4" aria-hidden />
              {kind === "institution" ? (target ? target.name : tf("newSchool")) : t(`kind.${kind}`)}
            </button>
            {problem && <ProblemAlert problem={problem} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="cp-name" label={t("nameLabel")}>
                <Input id="cp-name" value={name ?? ""} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field id="cp-country" label={t("countryLabel")}>
                <Input
                  id="cp-country"
                  maxLength={2}
                  value={country ?? ""}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </Field>
              {kind === "institution" ? (
                <>
                  <Field id="cp-city" label={t("cityLabel")}>
                    <Input id="cp-city" value={city ?? ""} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                  <Field id="cp-domain" label={tf("domainLabel")}>
                    <Input
                      id="cp-domain"
                      placeholder="example.edu"
                      value={domain ?? ""}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="cp-aliases" label={tf("aliasesLabel")}>
                      <TagInput
                        id="cp-aliases"
                        value={aliases}
                        onChange={setAliases}
                        max={20}
                        maxLength={200}
                        placeholder={u("aliasesPlaceholder")}
                        removeLabel={(tag) => u("removeTag", { tag })}
                      />
                    </Field>
                  </div>
                  <ImageUrlField id="cp-logo" label={t("logoLabel")} value={logoUrl ?? ""} onChange={setLogoUrl} />
                  <ImageUrlField
                    id="cp-cover"
                    label={t("coverLabel")}
                    value={coverUrl ?? ""}
                    onChange={setCoverUrl}
                    wide
                  />
                </>
              ) : (
                <>
                  <Field id="cp-provider" label={t("providerLabel")}>
                    <Select value={provider} onValueChange={(value) => value && setProvider(value)}>
                      <SelectTrigger id="cp-provider" className="min-h-11 w-full md:min-h-8">
                        <SelectValue>{t(`provider.${provider}`)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`provider.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="cp-basis" label={t("basisLabel")}>
                    <Select value={basis} onValueChange={(value) => value && setBasis(value)}>
                      <SelectTrigger id="cp-basis" className="min-h-11 w-full md:min-h-8">
                        <SelectValue>{t(`basis.${basis}`)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {BASES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`basis.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}
              <div className="sm:col-span-2">
                <Field
                  id="cp-source"
                  label={t("sourceLabel")}
                  error={sourceUrl.trim() !== "" && !isHttpsUrl(sourceUrl) ? t("httpsError") : null}
                >
                  <Input
                    id="cp-source"
                    type="url"
                    placeholder="https://"
                    aria-invalid={sourceUrl.trim() !== "" && !isHttpsUrl(sourceUrl)}
                    aria-describedby={sourceUrl.trim() !== "" && !isHttpsUrl(sourceUrl) ? "cp-source-error" : undefined}
                    value={sourceUrl ?? ""}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="cp-note" label={t("noteLabel")}>
                  <Input id="cp-note" maxLength={500} value={note ?? ""} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </div>
            </div>
            {kind === "institution" && spec.isLoading && (
              <p className="text-muted-foreground text-sm">{tf("factsLoading")}</p>
            )}
            {kind === "institution" && spec.isError && (
              <p role="alert" className="text-destructive text-sm">
                {tf("factsError")}
              </p>
            )}
            {groups.length > 0 && (
              <FactsStep
                groups={groups}
                state={facts}
                open={openGroups}
                error={factError}
                errorText={factError ? reasonText(factError.reason) : ""}
                onOpenChange={setOpenGroups}
                onChange={setFacts}
              />
            )}
          </>
        )}
      </div>
    </ResponsiveDialog>
  )
}
