"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Input, Label, Skeleton, StateView } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useShareVersion, useSnapshot, useVersions, type Essay, type EssayVersion } from "../api"
import { wordDiff } from "../diff"

function Diff({ older, newer }: { older: string; newer: string }) {
  const t = useT("essays")
  const parts = wordDiff(older, newer)
  if (!parts) return <p className="text-muted-foreground text-sm">{t("versions.tooLong")}</p>
  return (
    <p
      className="bg-muted/30 max-h-80 overflow-y-auto rounded-md p-3 text-sm whitespace-pre-wrap"
      data-testid="essay-diff"
    >
      {parts.map((p, i) =>
        p.op === "same" ? (
          <span key={i}>{p.text}</span>
        ) : p.op === "add" ? (
          <ins key={i} className="bg-success/15 text-success no-underline">
            {p.text}
          </ins>
        ) : (
          <del key={i} className="bg-destructive/10 text-destructive">
            {p.text}
          </del>
        ),
      )}
    </p>
  )
}

/**
 * Saved versions: name a snapshot, compare one with the current draft, restore it, and choose which
 * ones staff may read (nothing is shared until the student turns it on).
 */
export function VersionsPanel({
  essay,
  draftBody,
  beforeChange,
  onRestore,
  restoring,
}: {
  essay: Essay
  draftBody: string
  beforeChange: () => Promise<number>
  onRestore: (version: number) => void
  restoring: boolean
}) {
  const t = useT("essays")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const query = useVersions(essay.id)
  const snapshot = useSnapshot(essay.id)
  const share = useShareVersion(essay.id)
  const [name, setName] = useState("")
  const [open, setOpen] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<EssayVersion | null>(null)
  const fail = (error: unknown) => toast.error(errorMessage(error))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const lock = await beforeChange()
      await snapshot.mutateAsync({ lock_version: lock, name: name.trim() || null })
      setName("")
    } catch (error) {
      fail(error)
    }
  }
  return (
    <section className="flex flex-col gap-3" aria-label={t("versions.title")}>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="snapshot-name">{t("versions.name")}</Label>
          <Input id="snapshot-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={snapshot.isPending}>
          {t("versions.save")}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">{t("versions.auto")}</p>
      {query.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("versions.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.items.map((v) => (
            <li key={v.version} className="border-hairline flex flex-col gap-2 rounded-card border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">
                  <span className="font-medium">{v.name || t("versions.number", { version: v.version })}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    {t(`versions.source.${v.source}`)}
                    {" · "}
                    {t("words", { count: v.word_count })}
                    {v.created_at ? ` · ${format.dateTime(v.created_at)}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-expanded={open === v.version}
                    onClick={() => setOpen(open === v.version ? null : v.version)}
                  >
                    {t("versions.compare")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(v)}>
                    {t("versions.restore")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={v.shared ? "default" : "outline"}
                    aria-pressed={v.shared}
                    disabled={share.isPending}
                    onClick={() => share.mutate({ version: v.version, shared: !v.shared }, { onError: fail })}
                  >
                    <Icons.share aria-hidden />
                    {v.shared ? t("versions.shared") : t("versions.share")}
                  </Button>
                </span>
              </div>
              {open === v.version ? <Diff older={v.body} newer={draftBody} /> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground text-xs">{t("versions.shareHint")}</p>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("versions.restoreTitle")}
        description={t("versions.restoreText")}
        confirmLabel={t("versions.restore")}
        cancelLabel={t("cancel")}
        loading={restoring}
        onConfirm={() => {
          if (confirm) onRestore(confirm.version)
          setConfirm(null)
        }}
      />
    </section>
  )
}
