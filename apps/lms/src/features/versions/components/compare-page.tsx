"use client"

import { getLmsCourseCompareQuery, getLmsCourseVersionsQuery, type VersionCompare } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Field, FieldLabel, Icons, NativeSelect, NativeSelectOption, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"

type Change = VersionCompare["steps"][number]["change"]

const ROW_STYLE: Record<Change, string> = {
  same: "border-border text-muted-foreground",
  added: "border-emerald-500 bg-emerald-500/5",
  removed: "border-red-500 bg-red-500/5",
  changed: "border-amber-500 bg-amber-500/5",
}
const BADGE: Record<Change, "outline" | "default" | "destructive" | "secondary"> = {
  same: "outline",
  added: "default",
  removed: "destructive",
  changed: "secondary",
}

function shortId(id: string | null): string {
  return id ? id.slice(0, 8) : "-"
}

function CompareBody({ compare }: { compare: VersionCompare }) {
  const t = useT("compare")
  const differing = compare.steps.filter((step) => step.change !== "same").length
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" role="status">
        {differing === 0 ? t("identical") : t("differing", { count: differing })}
      </p>
      <ul className="flex flex-col gap-2">
        {compare.steps.map((step) => (
          <li
            key={step.step_id}
            data-change={step.change}
            className={cn("flex flex-col gap-1 rounded-lg border-s-4 border p-3", ROW_STYLE[step.change])}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={BADGE[step.change]}>{t(`changes.${step.change}`)}</Badge>
              <span className="min-w-0 flex-1 text-sm font-medium break-words">{step.title}</span>
            </div>
            {step.change !== "same" ? (
              <p className="text-muted-foreground font-mono text-xs">
                {t("revision", { number: compare.a })}: {shortId(step.revision_a)} →{" "}
                {t("revision", { number: compare.b })}: {shortId(step.revision_b)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** `/edit/compare/?id=&a=&b=`: the outline of two versions with the steps that differ highlighted (UF-LMS-11). */
export function ComparePage({ courseId, a, b }: { courseId: string; a: number; b: number }) {
  const t = useT("compare")
  const router = useRouter()
  const compare = useQuery(getLmsCourseCompareQuery(courseId, { a, b }))
  const versions = useQuery(getLmsCourseVersionsQuery(courseId))
  const numbers = versions.data?.map((item) => item.number) ?? [a, b]

  return (
    <EditorFrame
      courseId={courseId}
      current="versions"
      title={t("title", { a, b })}
      actions={
        <LinkButton href={hrefs.versions(courseId)} variant="outline" className="min-h-11 md:min-h-8">
          <Icons.chevronLeft aria-hidden />
          {t("backToVersions")}
        </LinkButton>
      }
    >
      {() => (
        <div className="flex flex-col gap-4">
          <div className="grid max-w-md grid-cols-2 gap-3">
            {(
              [
                ["a", a],
                ["b", b],
              ] as const
            ).map(([key, value]) => (
              <Field key={key}>
                <FieldLabel htmlFor={`compare-${key}`}>{t(key === "a" ? "from" : "to")}</FieldLabel>
                <NativeSelect
                  id={`compare-${key}`}
                  value={value}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    router.push(hrefs.compare(courseId, key === "a" ? next : a, key === "b" ? next : b))
                  }}
                  className="w-full"
                >
                  {numbers.map((number) => (
                    <NativeSelectOption key={number} value={number}>
                      {t("version", { number })}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            ))}
          </div>
          <QueryState query={compare} rows={3}>
            {(data) => <CompareBody compare={data} />}
          </QueryState>
        </div>
      )}
    </EditorFrame>
  )
}
