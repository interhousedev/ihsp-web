"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  Icons,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StateView,
  StatusBadge,
} from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { ScrollFade } from "../../../components/scroll-fade"
import { CURATOR_ROLES } from "../../../config/nav"
import { InstitutionCombobox } from "../../chooser/components/institution-combobox"
import type { Institution } from "../../chooser/types"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { EXEMPLAR_STATUSES, useExemplars, usePatchExemplar, type Exemplar, type ExemplarStatus } from "../api"
import { ExemplarDialog } from "./exemplar-dialog"
import { ImportDialog } from "./import-dialog"

const TONES = { draft: "neutral", published: "success", archived: "warning" } as const
const ANY = "any"

function Row({ item, onEdit }: { item: Exemplar; onEdit: () => void }) {
  const t = useT("exemplarsStaff")
  const errorMessage = useErrorMessage()
  const patch = usePatchExemplar()
  const [archiving, setArchiving] = useState(false)

  function archive() {
    patch.mutate(
      { id: item.id, lock_version: item.lock_version, status: "archived" },
      {
        onSuccess: () => {
          setArchiving(false)
          toast.success(t("archived"))
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{item.title}</span>
          <span className="text-muted-foreground text-xs">
            {[item.school_name, item.year, t(`kind.${item.kind}`), t("words", { count: item.word_count })]
              .filter((part) => part !== null && part !== "")
              .join(" · ")}
          </span>
        </div>
        <StatusBadge tone={TONES[item.status]} label={t(`status.${item.status}`)} />
      </div>
      {item.tags.length > 0 ? <p className="text-muted-foreground text-xs">{item.tags.join(", ")}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <a
          className="text-primary min-w-0 flex-1 text-sm break-all underline"
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.source_name || item.source_url}
        </a>
        <Button type="button" size="sm" variant="outline" className="min-h-11 md:min-h-8" onClick={onEdit}>
          {t("edit")}
        </Button>
        {item.status !== "archived" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={patch.isPending}
            onClick={() => setArchiving(true)}
          >
            {t("archive")}
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        title={t("archiveTitle")}
        description={t("archiveDescription", { title: item.title })}
        confirmLabel={t("archive")}
        destructive
        loading={patch.isPending}
        onConfirm={archive}
      />
    </li>
  )
}

export function ExemplarsStaffBody() {
  const t = useT("exemplarsStaff")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<ExemplarStatus | null>(null)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [year, setYear] = useState("")
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<Exemplar | null>(null)
  const yearNumber = /^\d{4}$/.test(year.trim()) ? Number(year) : null
  const query = useExemplars({ q, status, institutionId: institution?.id ?? null, year: yearNumber })

  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0)
    body = <StateView state="empty" icon={<Icons.inbox className="size-8" />} title={t("emptyTitle")} />
  else
    body = (
      <ScrollFade maxHeight="calc(100dvh - 22rem)">
        <ul className="flex flex-col gap-2">
          {query.data.items.map((item) => (
            <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
          ))}
        </ul>
      </ScrollFade>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="post"
        title={t("title")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setImporting(true)}>
              {t("import")}
            </Button>
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              {t("create")}
            </Button>
          </div>
        }
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="search"
          aria-label={t("searchLabel")}
          placeholder={t("searchLabel")}
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          value={status ?? ANY}
          onValueChange={(value) => setStatus(value === ANY ? null : (value as ExemplarStatus))}
        >
          <SelectTrigger aria-label={t("fieldStatus")} className="min-h-11 w-full md:min-h-8">
            <SelectValue>{status ? t(`status.${status}`) : t("anyStatus")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("anyStatus")}</SelectItem>
            {EXEMPLAR_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          inputMode="numeric"
          aria-label={t("fieldYear")}
          placeholder={t("fieldYear")}
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
        <InstitutionCombobox value={institution} onChange={setInstitution} placeholder={t("fieldInstitution")} />
      </div>
      {creating ? <ExemplarDialog open onOpenChange={setCreating} /> : null}
      {editing ? (
        <ExemplarDialog key={editing.id} open onOpenChange={(open) => !open && setEditing(null)} exemplar={editing} />
      ) : null}
      {importing ? <ImportDialog open onOpenChange={setImporting} /> : null}
      {body}
    </div>
  )
}

export function ExemplarsStaffPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <ExemplarsStaffBody />
    </AdmissionShell>
  )
}
