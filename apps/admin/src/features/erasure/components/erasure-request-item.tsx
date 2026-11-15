"use client"

import type { AdminErasureRequest } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { TOUCH } from "../../shared/utils/touch"
import type { ErasureDecision } from "./erasure-decision-dialog"

type Props = { request: AdminErasureRequest; onDecide: (decision: ErasureDecision) => void }

/** One request of the queue: who asked, when, the state, and approve / reject while it waits for review. */
export function ErasureRequestItem({ request, onDecide }: Props) {
  const t = useT("erasure")
  const f = useFormatters()
  const who = request.name ?? request.login ?? request.id
  const pending = request.status === "pending_review"
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <span className="grid gap-1">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {who}
          <Badge variant={pending ? "secondary" : "outline"}>{t(`status.${request.status}`)}</Badge>
          {request.roles.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </span>
        {request.login ? <span className="text-muted-foreground font-mono text-xs">{request.login}</span> : null}
        <span className="text-muted-foreground text-xs">
          {t("requested", { date: f.dateTime(request.requested_at) })}
          {request.closes_on ? ` · ${t("closesOn", { date: f.date(request.closes_on) })}` : ""}
        </span>
        {request.reject_reason ? (
          <span className="text-muted-foreground text-xs">{t("reasonShown", { reason: request.reject_reason })}</span>
        ) : null}
      </span>
      {pending ? (
        <span className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            aria-label={t("rejectFor", { name: who })}
            onClick={() => onDecide({ request, kind: "reject" })}
          >
            {t("rejectAction")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className={TOUCH}
            aria-label={t("approveFor", { name: who })}
            onClick={() => onDecide({ request, kind: "approve" })}
          >
            {t("approveAction")}
          </Button>
        </span>
      ) : null}
    </li>
  )
}
