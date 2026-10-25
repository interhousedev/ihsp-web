"use client"

import { deleteAdminKnowledge, getAdminKnowledgeQuery, keys, type KnowledgeEntry } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  ConfirmDialog,
  Dropdown,
  IconPencil,
  IconPlus,
  IconTrash,
  Input,
  PageContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useDebouncedCallback,
  type DropdownOption,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import { useEffect, useMemo, useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { KnowledgeDialog } from "./knowledge-dialog"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

/** Knowledge base (admin): the entries the assistant searches; search, tag filter, create, edit and delete. */
export function KnowledgePage() {
  const t = useT("knowledge")
  const f = useFormatters()
  const [{ q, tags, page }, setFilters] = useQueryStates({
    q: parseAsString,
    tags: parseAsArrayOf(parseAsString),
    page: parseAsInteger.withDefault(1),
  })
  const [text, setText] = useState(q ?? "")
  const push = useDebouncedCallback(
    (next: string) => void setFilters({ q: next.trim() === "" ? null : next.trim(), page: null }),
    SEARCH_DEBOUNCE_MS,
  )
  useEffect(() => setText(q ?? ""), [q])
  const params = { q: q ?? undefined, tags: tags ?? undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
  const query = useQuery({ ...getAdminKnowledgeQuery(params), placeholderData: (previous) => previous })
  const [known, setKnown] = useState<string[]>([])
  useEffect(() => {
    const seen = query.data?.items.flatMap((entry) => entry.tags) ?? []
    setKnown((old) => [...new Set([...old, ...seen])].toSorted())
  }, [query.data])
  const tagOptions = useMemo<DropdownOption[]>(
    () => [...new Set([...known, ...(tags ?? [])])].toSorted().map((tag) => ({ value: tag, label: tag })),
    [known, tags],
  )
  const [editing, setEditing] = useState<KnowledgeEntry | "new" | null>(null)
  const [deleting, setDeleting] = useState<KnowledgeEntry | null>(null)
  const remove = useAdminMutation({
    mutationFn: (entry: KnowledgeEntry) => deleteAdminKnowledge(entry.id),
    invalidate: [keys.admin.knowledge.all()],
    success: t("deleted"),
    onSuccess: () => setDeleting(null),
  })
  const filtered = q !== null || (tags?.length ?? 0) > 0

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setEditing("new")}>
          <IconPlus aria-hidden /> {t("add")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div role="toolbar" aria-label={t("filters")} className="flex flex-wrap items-end gap-2">
          <Input
            type="search"
            value={text}
            aria-label={t("search")}
            placeholder={t("search")}
            className={`${TOUCH} w-full sm:w-64`}
            onChange={(event) => {
              setText(event.target.value)
              push(event.target.value)
            }}
          />
          <div className="w-full sm:w-56">
            <Dropdown
              multiple
              aria-label={t("tagFilter")}
              placeholder={t("tagFilter")}
              options={tagOptions}
              value={tags ?? []}
              onValueChange={(next) => void setFilters({ tags: next.length > 0 ? next : null, page: null })}
            />
          </div>
        </div>
        <QueryState
          query={query}
          rows={5}
          isEmpty={(result) => result.items.length === 0}
          emptyText={filtered ? t("emptyFiltered") : t("empty")}
        >
          {(result) => (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("columns.key")}</TableHead>
                      <TableHead>{t("columns.title")}</TableHead>
                      <TableHead>{t("columns.tags")}</TableHead>
                      <TableHead>{t("columns.updated")}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t("columns.actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                        <TableCell className="font-medium">{entry.title ?? "—"}</TableCell>
                        <TableCell>
                          <span className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                            {entry.accessible_to_guest ? <Badge variant="outline">{t("badgeGuest")}</Badge> : null}
                            {entry.accessible_to_student ? <Badge variant="outline">{t("badgeStudent")}</Badge> : null}
                          </span>
                        </TableCell>
                        <TableCell>{f.dateTime(entry.updated_at)}</TableCell>
                        <TableCell>
                          <span className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={TOUCH_ICON}
                              aria-label={t("editEntry", { key: entry.key })}
                              onClick={() => setEditing(entry)}
                            >
                              <IconPencil aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={TOUCH_ICON}
                              aria-label={t("deleteEntry", { key: entry.key })}
                              onClick={() => setDeleting(entry)}
                            >
                              <IconTrash aria-hidden />
                            </Button>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  className={TOUCH}
                  disabled={page <= 1}
                  onClick={() => void setFilters({ page: Math.max(1, page - 1) })}
                >
                  {t("prev")}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {t("page", { page, pages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)) })}
                </span>
                <Button
                  variant="outline"
                  className={TOUCH}
                  disabled={result.offset + result.items.length >= result.total}
                  onClick={() => void setFilters({ page: page + 1 })}
                >
                  {t("next")}
                </Button>
              </div>
            </>
          )}
        </QueryState>
      </div>
      {editing ? (
        <KnowledgeDialog
          key={editing === "new" ? "new" : editing.id}
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeleting(null))}
          title={t("deleteTitle", { key: deleting.key })}
          description={t("deleteText")}
          confirmLabel={t("confirmDelete")}
          destructive
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
        />
      ) : null}
    </PageContainer>
  )
}
