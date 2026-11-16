"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Checkbox, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { toast } from "sonner"
import { useChecklist, usePatchChecklist, type ChecklistItem } from "../api"

const DONE = "done"
const TODO = "todo"

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const t = useT("documents")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const patch = usePatchChecklist()
  const title = t.has(`checklist.${item.title_key}`) ? t(`checklist.${item.title_key}`) : item.title_key
  const done = item.status === DONE
  return (
    <li className="flex items-start gap-3 py-2">
      <Checkbox
        aria-label={title}
        checked={done}
        disabled={patch.isPending}
        onCheckedChange={(checked) =>
          patch.mutate(
            { id: item.id, status: checked ? DONE : TODO },
            { onError: (error) => toast.error(errorMessage(error)) },
          )
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={done ? "text-muted-foreground line-through" : "font-medium"}>{title}</span>
        <span className="text-muted-foreground text-xs">
          {t(`owner.${item.owner}`)}
          {item.due_utc ? ` · ${t("due", { date: date(item.due_utc) })}` : ""}
        </span>
      </div>
      {!done && item.status !== TODO && <StatusBadge tone="neutral" label={t(`checklistStatus.${item.status}`)} />}
    </li>
  )
}

/** The student checklist: shared items first, then per-university items. */
export function ChecklistSection() {
  const t = useT("documents")
  const query = useChecklist()
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("checklistEmpty")} />
  return (
    <ul className="divide-y rounded-card border px-3" aria-label={t("checklistTitle")}>
      {query.data.map((item) => (
        <ChecklistRow key={item.id} item={item} />
      ))}
    </ul>
  )
}
