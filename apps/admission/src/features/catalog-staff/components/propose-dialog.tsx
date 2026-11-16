"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCreateProposal, useInstitutionSearch, type InstitutionHit, type ProposalKind } from "../api"

const KINDS: ProposalKind[] = ["institution", "scholarship"]
const PROVIDERS = ["institution", "government", "foundation"] as const
const BASES = ["merit", "need", "government", "sports", "work_study"] as const

/** POST /staff/catalog/proposals: a new or edited university or scholarship, always with a source link. */
export function ProposeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("catalogStaff")
  const errorMessage = useErrorMessage()
  const create = useCreateProposal()
  const [kind, setKind] = useState<ProposalKind>("institution")
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [provider, setProvider] = useState<string>(PROVIDERS[0])
  const [basis, setBasis] = useState<string>(BASES[0])
  const [sourceUrl, setSourceUrl] = useState("")
  const [note, setNote] = useState("")
  const [q, setQ] = useState("")
  const [target, setTarget] = useState<InstitutionHit | null>(null)
  const hits = useInstitutionSearch(kind === "institution" && !target ? q : "")

  const fields: Record<string, unknown> =
    kind === "institution"
      ? { name, country: country.toUpperCase(), city }
      : { name, provider, basis, country: country.toUpperCase() }
  const filled = Object.values(fields).some((value) => value !== "")
  const ready = filled && sourceUrl.trim() !== "" && (target !== null || name.trim() !== "")

  async function submit(event: FormEvent) {
    event.preventDefault()
    const clean = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ""))
    try {
      await create.mutateAsync({
        kind,
        target_id: kind === "institution" ? (target?.id ?? null) : null,
        fields: clean,
        source_url: sourceUrl.trim(),
        note: note.trim() || null,
      })
      toast.success(t("sent"))
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("proposeTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" disabled={!ready} loading={create.isPending}>
          {t("submit")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <Select
          value={kind}
          onValueChange={(value) => {
            if (!value) return
            setKind(value as ProposalKind)
            setTarget(null)
          }}
        >
          <SelectTrigger aria-label={t("kindLabel")} className="min-h-11 w-full md:min-h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`kind.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kind === "institution" &&
          (target ? (
            <div className="flex items-center justify-between gap-2 rounded-card border p-2 text-sm">
              <span>{target.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(null)}>
                {t("clear")}
              </Button>
            </div>
          ) : (
            <>
              <Input
                aria-label={t("editLabel")}
                placeholder={t("editLabel")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {hits.data && hits.data.length === 0 && <p className="text-muted-foreground text-sm">{t("noResults")}</p>}
              <ul className="flex flex-col gap-1">
                {hits.data?.map((hit) => (
                  <li key={hit.id}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setTarget(hit)}
                    >
                      {hit.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ))}
        <label className="flex flex-col gap-1 text-sm">
          {t("nameLabel")}
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("countryLabel")}
          <Input value={country} maxLength={2} onChange={(e) => setCountry(e.target.value)} />
        </label>
        {kind === "institution" ? (
          <label className="flex flex-col gap-1 text-sm">
            {t("cityLabel")}
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
        ) : (
          <>
            <Select value={provider} onValueChange={(value) => value && setProvider(value)}>
              <SelectTrigger aria-label={t("providerLabel")} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`provider.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={basis} onValueChange={(value) => value && setBasis(value)}>
              <SelectTrigger aria-label={t("basisLabel")} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`basis.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t("sourceLabel")}
          <Input type="url" inputMode="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("noteLabel")}
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
    </ResponsiveDialog>
  )
}
