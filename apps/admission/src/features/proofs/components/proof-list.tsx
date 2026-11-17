"use client"

import { uploadFile } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, ResponsiveDialog, StateView, safeHttpUrl } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { useAddProof, useProofs, type Proof } from "../api"
import { PROOF_URL_MAX, validateProofUrl } from "../lib/proof-url"
import { ProofStatusBadge } from "./proof-status-badge"

type Mode = "url" | "file"

/** Adds a proof to an item: a public https link, or a file uploaded through the files API. */
export function AddProofDialog({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("proofs")
  const tCommon = useT("common")
  const errorMessage = useErrorMessage()
  const add = useAddProof(itemId)
  const [mode, setMode] = useState<Mode>("url")
  const [url, setUrl] = useState("")
  const [touched, setTouched] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const problem = mode === "url" ? validateProofUrl(url) : null
  const showProblem = touched && problem !== null && url.trim() !== ""
  const canSend = mode === "url" ? problem === null : file !== null
  const pending = busy || add.isPending

  function close() {
    onOpenChange(false)
    setUrl("")
    setFile(null)
    setTouched(false)
    setError(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!canSend) return
    setError(null)
    try {
      if (mode === "url") {
        await add.mutateAsync({ url: url.trim() })
      } else if (file) {
        setBusy(true)
        const uploaded = await uploadFile(file, "ai_upload")
        if (uploaded.status !== "ready") throw new Error(t("rejected"))
        await add.mutateAsync({ file_id: uploaded.id })
      }
      close()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("addTitle")}
      onSubmit={submit}
      noValidate
      disablePointerDismissal={pending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !canSend}>
            {t("add")}
          </Button>
        </>
      }
    >
      <div className="flex gap-2">
        {(["url", "file"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={mode === value ? "default" : "outline"}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {t(`mode_${value}`)}
          </Button>
        ))}
      </div>
      {mode === "url" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="proof-url">{t("url")}</Label>
          <Input
            id="proof-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            maxLength={PROOF_URL_MAX}
            placeholder="https://"
            value={url}
            aria-invalid={showProblem}
            aria-describedby={showProblem ? "proof-url-problem" : undefined}
            onBlur={() => setTouched(true)}
            onChange={(event) => setUrl(event.target.value)}
          />
          {showProblem ? (
            <p id="proof-url-problem" role="alert" className="text-destructive text-sm">
              {t(`problem_${problem}`)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="proof-file">{t("file")}</Label>
          <Input id="proof-file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </div>
      )}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}

function ProofRow({ proof }: { proof: Proof }) {
  const t = useT("proofs")
  const href = safeHttpUrl(proof.url)
  const title = proof.title || proof.url || t("file")
  return (
    <li className="border-hairline flex flex-wrap items-center justify-between gap-2 rounded-card border p-3">
      <div className="flex min-w-0 items-center gap-2">
        {proof.url ? (
          <Icons.externalLink className="size-4 shrink-0" aria-hidden />
        ) : (
          <Icons.page className="size-4 shrink-0" aria-hidden />
        )}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate underline-offset-4 hover:underline"
          >
            {title}
          </a>
        ) : (
          <span className="truncate">{title}</span>
        )}
      </div>
      <ProofStatusBadge status={proof.status} />
    </li>
  )
}

/** The proofs of one item with their check status; `self_provided` is shown as self-reported, never as verified. */
export function ProofList({ itemId }: { itemId: string }) {
  const t = useT("proofs")
  const proofs = useProofs(itemId)
  const [open, setOpen] = useState(false)

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{t("title")}</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      </div>
      {proofs.isPending ? (
        <StateView state="loading" rows={1} />
      ) : proofs.isError ? (
        <StateView state="error" error={proofs.error} onRetry={() => proofs.refetch()} />
      ) : proofs.data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {proofs.data.items.map((proof) => (
            <ProofRow key={proof.id} proof={proof} />
          ))}
        </ul>
      )}
      <AddProofDialog itemId={itemId} open={open} onOpenChange={setOpen} />
    </section>
  )
}
