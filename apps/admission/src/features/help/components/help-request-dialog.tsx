"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, Input, Label, Textarea, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { useAdmissionConfig } from "../../../lib/config"
import { useCreateGuestLink, useCreateHelpRequest, type CreatedGuestLink, type Helper, type HelpKind } from "../api"
import { GuestLinkResultDialog } from "./guest-link-result-dialog"
import { HelperSearch } from "./helper-search"
import { useValueLabel } from "./status-badges"

/** The kinds of the contract (`HelpRequestIn.kind`); an exhaustive record keeps this list in step with the generated enum. */
const KINDS: Record<HelpKind, true> = { website: true, design: true, proof: true, other: true }

/** `maxLength` of `HelpRequestIn.brief` and `GuestLinkIn.brief` in the OpenAPI document. */
const BRIEF_MAX = 1000

type Who = "account" | "link"

/**
 * Asks someone for help, optionally about one item. An account helper gets a request in their inbox; an outside
 * helper gets a guest link, shown once after creation.
 */
export function HelpRequestDialog({
  open,
  onOpenChange,
  itemId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: string
}) {
  const t = useT("help")
  const tCommon = useT("common")
  const errorMessage = useErrorMessage()
  const kindLabel = useValueLabel("kind")
  const config = useAdmissionConfig()
  const createRequest = useCreateHelpRequest()
  const createLink = useCreateGuestLink()
  const [kind, setKind] = useState<HelpKind>("other")
  const [brief, setBrief] = useState("")
  const [who, setWho] = useState<Who>("account")
  const [helper, setHelper] = useState<Helper | null>(null)
  const [days, setDays] = useState<string>("")
  const [error, setError] = useState<unknown>(null)
  const [created, setCreated] = useState<CreatedGuestLink | null>(null)

  const ttlDays = (config.data?.guest_links as { ttl_days?: number } | undefined)?.ttl_days
  const pending = createRequest.isPending || createLink.isPending

  function reset() {
    setKind("other")
    setBrief("")
    setWho("account")
    setHelper(null)
    setDays("")
    setError(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!brief.trim()) return
    setError(null)
    try {
      if (who === "link") {
        const parsed = days ? Number(days) : null
        const link = await createLink.mutateAsync({
          kind,
          brief: brief.trim(),
          item_id: itemId ?? null,
          expires_in_days: parsed && Number.isInteger(parsed) ? parsed : null,
        })
        onOpenChange(false)
        reset()
        setCreated(link)
      } else {
        await createRequest.mutateAsync({
          kind,
          brief: brief.trim(),
          item_id: itemId ?? null,
          helper_user_id: helper?.user_id ?? null,
        })
        onOpenChange(false)
        reset()
      }
    } catch (e) {
      setError(e)
    }
  }

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("request.title")}
        onSubmit={submit}
        disablePointerDismissal={pending}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={pending || !brief.trim()}>
              {who === "link" ? t("request.createLink") : t("request.send")}
            </Button>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("request.kind")}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(KINDS) as HelpKind[]).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={kind === value ? "default" : "outline"}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {kindLabel(value)}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="help-brief">{t("request.brief")}</Label>
          <Textarea
            id="help-brief"
            value={brief}
            maxLength={BRIEF_MAX}
            placeholder={t("request.briefPlaceholder")}
            onChange={(event) => setBrief(event.target.value)}
          />
          <p className="text-muted-foreground text-end text-xs">
            {brief.length}/{BRIEF_MAX}
          </p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("request.who")}</legend>
          <div className="flex flex-wrap gap-2">
            {(["account", "link"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={who === value ? "default" : "outline"}
                aria-pressed={who === value}
                onClick={() => setWho(value)}
              >
                {t(`request.who_${value}`)}
              </Button>
            ))}
          </div>
          {who === "account" ? (
            helper ? (
              <div className="flex items-center justify-between gap-2 rounded-card border p-2 ps-3">
                <span className="truncate">{helper.display_name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setHelper(null)}>
                  {t("request.changeHelper")}
                </Button>
              </div>
            ) : (
              <HelperSearch onPick={setHelper} />
            )
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="help-days">{t("request.days")}</Label>
              <Input
                id="help-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={days}
                placeholder={ttlDays ? String(ttlDays) : undefined}
                onChange={(event) => setDays(event.target.value)}
              />
              <Alert>
                <Icons.eye aria-hidden />
                <AlertDescription>{t("request.scopeNote")}</AlertDescription>
              </Alert>
            </div>
          )}
        </fieldset>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(error)}
          </p>
        ) : null}
      </ResponsiveDialog>
      <GuestLinkResultDialog created={created} onClose={() => setCreated(null)} />
    </>
  )
}

/** A button that opens the help-request dialog for one item; mount it on any item card. */
export function HelpRequestButton({ itemId }: { itemId?: string }) {
  const t = useT("help")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Icons.help aria-hidden />
        {t("request.open")}
      </Button>
      <HelpRequestDialog open={open} onOpenChange={setOpen} itemId={itemId} />
    </>
  )
}
