"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Label, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { toast } from "sonner"
import { EXEMPLAR_KINDS, IMPORT_LIMIT, useImportExemplars, type ExemplarInput, type ExemplarKind } from "../api"

export const IMPORT_COLUMNS = [
  "title",
  "kind",
  "body",
  "source_url",
  "school_name",
  "year",
  "language",
  "prompt",
  "source_name",
  "notes",
  "tags",
] as const

export type RowProblem = "title" | "kind" | "body" | "url" | "year" | "tags"
export type ParsedRow = {
  line: number
  item: ExemplarInput
  problems: RowProblem[]
}
export type ParsedFile = { rows: ParsedRow[]; tooMany: boolean } | "unreadable" | "empty"

/** RFC 4180 CSV: quoted cells may hold commas, quotes ("") and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const src = text.replace(/^\uFEFF/, "")
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(cell)
      cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      row.push(cell)
      cell = ""
      if (row.some((v) => v.trim() !== "")) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((v) => v.trim() !== "")) rows.push(row)
  return rows
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim())

function tagList(v: unknown): string[] {
  const parts = Array.isArray(v) ? v.map(str) : str(v).split(/[;|]/)
  return [...new Set(parts.map((p) => p.trim().toLowerCase()).filter(Boolean))]
}

function check(raw: Record<string, unknown>, line: number): ParsedRow {
  const problems: RowProblem[] = []
  const title = str(raw.title)
  const body = str(raw.body)
  const url = str(raw.source_url)
  const kind = str(raw.kind)
  const yearText = str(raw.year)
  const year = yearText === "" ? null : Number(yearText)
  const tags = tagList(raw.tags)
  if (!title || title.length > 200) problems.push("title")
  if (!(EXEMPLAR_KINDS as readonly string[]).includes(kind)) problems.push("kind")
  if (!body || body.length > 20000) problems.push("body")
  if (!/^https?:\/\/\S+$/i.test(url) || url.length > 500) problems.push("url")
  if (year !== null && !(Number.isInteger(year) && year >= 1900 && year <= 2100)) problems.push("year")
  if (tags.length > 12 || tags.some((tag) => tag.length > 40)) problems.push("tags")
  const item: ExemplarInput = {
    title,
    kind: kind as ExemplarKind,
    body,
    source_url: url,
    school_name: str(raw.school_name),
    source_name: str(raw.source_name),
    year: year !== null && Number.isFinite(year) ? year : null,
    language: str(raw.language) || "en",
    prompt: str(raw.prompt),
    notes: str(raw.notes),
    tags,
  }
  return { line, item, problems }
}

/** Parses an uploaded `.csv` (header row) or `.json` (list of objects) file into checked rows. */
export function parseImportFile(name: string, text: string): ParsedFile {
  let objects: Record<string, unknown>[]
  if (name.toLowerCase().endsWith(".json")) {
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return "unreadable"
    }
    const list = Array.isArray(data) ? data : (data as { items?: unknown } | null)?.items
    if (!Array.isArray(list)) return "unreadable"
    objects = list.map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
  } else {
    const table = parseCsv(text)
    const [head, ...rest] = table
    if (!head) return "empty"
    const names = head.map((h) => h.trim().toLowerCase())
    if (!names.includes("title") || !names.includes("body")) return "unreadable"
    objects = rest.map((cells) => Object.fromEntries(names.map((n, i) => [n, cells[i] ?? ""])))
  }
  if (objects.length === 0) return "empty"
  return {
    rows: objects.slice(0, IMPORT_LIMIT).map((o, i) => check(o, i + 1)),
    tooMany: objects.length > IMPORT_LIMIT,
  }
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
const TEMPLATE = [
  IMPORT_COLUMNS.join(","),
  [
    "Why this school",
    "why_us",
    "Essay text…",
    "https://example.edu/essay",
    "",
    "2025",
    "en",
    "",
    "",
    "",
    "stem;research",
  ]
    .map(csvCell)
    .join(","),
].join("\n")

function host(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

/** POST /staff/exemplars/import: a CSV or JSON file with up to 50 exemplars, previewed row by row; valid rows are stored as drafts. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("exemplarsStaff")
  const u = useT("settingsUx")
  const errorMessage = useErrorMessage()
  const run = useImportExemplars()
  const input = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const rows = parsed && typeof parsed === "object" ? parsed.rows : []
  const valid = rows.filter((r) => r.problems.length === 0)

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParsed(parseImportFile(file.name, await file.text()))
    event.target.value = ""
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (valid.length === 0) return
    try {
      const result = await run.mutateAsync(valid.map((r) => r.item))
      toast.success(
        t("imported", {
          created: result.created.length,
          duplicates: result.duplicates.length,
        }),
      )
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("importTitle")}
      onSubmit={submit}
      size="lg"
      footer={
        <LoadingButton type="submit" loading={run.isPending} disabled={valid.length === 0}>
          {u("importCount", { count: valid.length })}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-import-file" className="text-muted-foreground text-[13px] font-normal">
            {u("importFile", { limit: IMPORT_LIMIT })}
          </Label>
          <input
            ref={input}
            id="ex-import-file"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            onChange={pick}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              onClick={() => input.current?.click()}
            >
              <Icons.upload className="size-4" />
              {u("chooseFile")}
            </Button>
            <a
              href={templateHref}
              download="exemplars-template.csv"
              className="text-primary inline-flex min-h-11 items-center text-sm underline md:min-h-8"
            >
              {u("template")}
            </a>
            {fileName ? <span className="text-muted-foreground min-w-0 truncate text-xs">{fileName}</span> : null}
          </div>
          <p className="text-muted-foreground text-xs">{u("importColumns")}</p>
        </div>
        {parsed === "unreadable" || parsed === "empty" ? (
          <p role="alert" className="text-destructive text-sm">
            {u(parsed === "empty" ? "importEmpty" : "importUnreadable")}
          </p>
        ) : null}
        {parsed && typeof parsed === "object" ? (
          <>
            {parsed.tooMany ? (
              <p role="alert" className="text-destructive text-sm">
                {u("importTooMany", { limit: IMPORT_LIMIT })}
              </p>
            ) : null}
            <p className="text-sm" aria-live="polite">
              {u("importSummary", { valid: valid.length, total: rows.length })}
            </p>
            <div className="overflow-x-auto rounded-card border">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">{t("fieldTitle")}</th>
                    <th className="p-2">{t("fieldKind")}</th>
                    <th className="p-2">{t("fieldSourceUrl")}</th>
                    <th className="p-2">{u("rowCheck")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className="border-t align-top">
                      <td className="p-2 tabular-nums">{r.line}</td>
                      <td className="max-w-48 truncate p-2">{r.item.title}</td>
                      <td className="p-2">{r.problems.includes("kind") ? "—" : t(`kind.${r.item.kind}`)}</td>
                      <td className="max-w-40 truncate p-2">{host(r.item.source_url)}</td>
                      <td className="p-2">
                        {r.problems.length === 0 ? (
                          <span className="text-success">{u("rowOk")}</span>
                        ) : (
                          <ul className="text-destructive">
                            {r.problems.map((p) => (
                              <li key={p}>{u(`rowProblem.${p}`)}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
