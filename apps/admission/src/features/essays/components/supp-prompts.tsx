"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, buttonVariants, Label, Skeleton, Textarea } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useCreateEssay, useSuppPrompts, type SuppCycle } from "../api"
import { Diff } from "./versions-panel"

type Prompt = SuppCycle["prompts"][number]

const BADGE = { new: "info", changed: "warning", same: "neutral", removed: "destructive" } as const

/**
 * This year's supplemental prompts of the linked college, what changed since last year (with the old
 * wording diffed against the new one), and a button that starts an essay from a prompt.
 */
export function SuppPrompts({
  institutionId,
  listEntryId,
  college,
  websiteUrl,
}: {
  institutionId: string
  listEntryId: string
  college: string
  websiteUrl?: string | null
}) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const query = useSuppPrompts(institutionId)
  const create = useCreateEssay()
  const [own, setOwn] = useState(false)
  const [custom, setCustom] = useState("")
  if (query.isPending) return <Skeleton className="h-16 w-full" />
  if (query.isError) return <p className="text-destructive text-sm">{errorMessage(query.error)}</p>
  const current = query.data[0]
  const start = (promptText: string, wordLimit: number | null) =>
    create.mutate(
      {
        kind: "supplemental",
        title: t("supp.title", { college }),
        prompt_text: promptText,
        word_limit: wordLimit,
        list_entry_id: listEntryId,
      },
      {
        onSuccess: (essay) => router.push(`/essays/edit/?id=${encodeURIComponent(essay.id)}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  const active = current ? current.prompts.filter((p) => p.status !== "removed") : []
  if (!current || active.length === 0) {
    const promptSource = query.data.flatMap((cycle) => cycle.prompts).find((p) => p.source_url)?.source_url
    const official = promptSource ?? websiteUrl
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">{t("supp.none")}</p>
        <div className="flex flex-wrap gap-2">
          {official ? (
            <a
              href={official}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("supp.officialPage")}
            </a>
          ) : (
            <Link
              href={`/chooser/institution/?id=${encodeURIComponent(institutionId)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("supp.openCollege")}
            </Link>
          )}
          <Button type="button" size="sm" variant="outline" aria-expanded={own} onClick={() => setOwn((v) => !v)}>
            {t("supp.addOwn")}
          </Button>
        </div>
        {own ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`supp-own-${listEntryId}`}>{t("supp.customPrompt")}</Label>
            <Textarea
              id={`supp-own-${listEntryId}`}
              rows={3}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={create.isPending || !custom.trim()}
              onClick={() => start(custom.trim(), null)}
            >
              {t("supp.start")}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }
  const hasPrevious = query.data.length > 1
  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium">{t("supp.prompts", { cycle: current.cycle })}</h3>
        <ol className="flex flex-col gap-3">
          {active.map((p) => (
            <li key={p.position} className="flex flex-col gap-1">
              <p className="whitespace-pre-wrap">{p.prompt}</p>
              <p className="text-muted-foreground text-xs">
                {[
                  p.word_limit ? t("supp.words", { count: p.word_limit }) : null,
                  p.required ? null : t("supp.optional"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {p.source_url ? (
                  <>
                    {" "}
                    <a href={p.source_url} target="_blank" rel="noreferrer" className="underline">
                      {t("supp.source")}
                    </a>
                  </>
                ) : null}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start"
                disabled={create.isPending}
                onClick={() => start(p.prompt, p.word_limit ?? null)}
              >
                {t("supp.start")}
              </Button>
            </li>
          ))}
        </ol>
      </section>
      {hasPrevious ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium">{t("supp.changes")}</h3>
          <ul className="flex flex-col gap-3">
            {current.prompts.map((p) => (
              <li key={`${p.status}-${p.position}`} className="flex flex-col gap-1">
                <Badge variant={BADGE[p.status]} className="self-start">
                  {t(`supp.status.${p.status}`)}
                </Badge>
                {p.status === "changed" && p.previous_text ? (
                  <Diff older={p.previous_text} newer={p.prompt} />
                ) : (
                  <p className={p.status === "removed" ? "text-muted-foreground line-through" : "line-clamp-3"}>
                    {p.prompt}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
