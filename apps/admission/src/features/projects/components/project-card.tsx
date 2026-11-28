"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useCreateItem } from "../../items/api"
import type { Project } from "../api"
import { buildProjectPrompt } from "../prompt"
import { HelpersDrawer } from "./helpers-drawer"

/** The limits of an activity entry: a project taken into drafts must fit them. */
const TITLE_MAX = 60
const DESCRIPTION_MAX = 600

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="bg-muted/50 flex flex-col gap-0.5 rounded-lg p-3">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/**
 * One idea, read top to bottom as a decision: what it is, why it fits, what exists at the end, how to start.
 * The background (obstacles, similar projects, the effect on the application) stays folded under "More".
 */
export function ProjectCard({ project, rank }: { project: Project; rank?: number }) {
  const t = useT("projects")
  const errorMessage = useErrorMessage()
  const create = useCreateItem()
  const [helpers, setHelpers] = useState(false)
  const [taken, setTaken] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildProjectPrompt(project))
      toast.success(t("card.copied"))
    } catch {
      toast.error(t("card.copyFailed"))
    }
  }

  function take() {
    create.mutate(
      {
        kind: "activity",
        status: "draft",
        title: project.title.slice(0, TITLE_MAX),
        organization: "",
        description: (project.deliverable || project.summary).slice(0, DESCRIPTION_MAX),
        category: null,
        grades: [],
        timing: [],
        hours_per_week: null,
        weeks_per_year: null,
        intend_in_college: null,
      },
      {
        onSuccess: () => {
          setTaken(true)
          toast.success(t("card.taken"))
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const more = project.challenges.length > 0 || project.analogs.length > 0 || Boolean(project.application_effect)

  return (
    <li className="bg-card flex flex-col gap-4 rounded-card border p-4 sm:p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {rank !== undefined && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
              {rank}
            </span>
          )}
          {project.weeks != null && (
            <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
              <Icons.clock aria-hidden className="size-3" />
              {t("card.weeks", { count: project.weeks })}
            </span>
          )}
        </div>
        <h3 className="text-lg leading-snug font-semibold">{project.title}</h3>
        <p className="text-sm">{project.summary}</p>
        {project.why_you && (
          <p className="text-muted-foreground flex gap-2 text-sm">
            <Icons.sparkles aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
            <span>
              <span className="text-foreground font-medium">{t("card.whyYou")}</span> {project.why_you}
            </span>
          </p>
        )}
      </header>

      {(project.deliverable || project.measure) && (
        <dl className="grid gap-2 sm:grid-cols-2">
          {project.deliverable && <Fact label={t("card.deliverable")}>{project.deliverable}</Fact>}
          {project.measure && <Fact label={t("card.measure")}>{project.measure}</Fact>}
        </dl>
      )}

      {project.first_steps.length > 0 && (
        <section className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">{t("card.steps")}</h4>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            {project.first_steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      )}

      {more && (
        <details className="group border-t pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium sm:min-h-0">
            <Icons.chevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />
            {t("card.more")}
          </summary>
          <div className="flex flex-col gap-3 pt-3">
            {project.challenges.length > 0 && (
              <section className="flex flex-col gap-1">
                <h4 className="text-sm font-medium">{t("card.challenges")}</h4>
                <ul className="list-disc pl-5 text-sm">
                  {project.challenges.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            )}
            {project.application_effect && (
              <section className="flex flex-col gap-1">
                <h4 className="text-sm font-medium">{t("card.effect")}</h4>
                <p className="text-sm">{project.application_effect}</p>
              </section>
            )}
            {project.analogs.length > 0 && (
              <section className="flex flex-col gap-1">
                <h4 className="text-sm font-medium">{t("card.analogs")}</h4>
                <ul className="flex flex-col gap-1">
                  {project.analogs.map((a) => (
                    <li key={`${a.name}-${a.where}`} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{t(`card.where.${a.where}`)}</span>
                      {a.url ? (
                        <a
                          className="text-primary inline-flex min-h-11 items-center gap-1 underline sm:min-h-0"
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.name}
                          <Icons.externalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <span>{a.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </details>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {taken ? (
          <Button render={<Link href="/activities/" />} nativeButton={false} size="sm" className="min-h-11">
            <Icons.check aria-hidden className="size-4" />
            {t("card.openDraft")}
          </Button>
        ) : (
          <Button type="button" size="sm" className="min-h-11" disabled={create.isPending} onClick={take}>
            {t("card.take")}
          </Button>
        )}
        {project.help_tags.length > 0 && (
          <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setHelpers(true)}>
            {t("card.helpers")}
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => void copy()}>
          <Icons.copy aria-hidden className="size-4" />
          {t("card.copyPrompt")}
        </Button>
      </div>
      {helpers && <HelpersDrawer open onOpenChange={setHelpers} title={project.title} tags={project.help_tags} />}
    </li>
  )
}
