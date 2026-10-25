"use client"

import type { AssessmentItem } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import Link from "next/link"
import { LinkButton } from "../../shared/components/link-button"
import { QueryState } from "../../shared/components/query-state"
import { useExamLabels } from "../hooks/use-exam-labels"
import { useSubjectMaterials } from "../hooks/use-exams"
import { lessonHref } from "../utils/hrefs"
import { materialsSince } from "../utils/materials-since"
import { previousControl } from "../utils/previous-control"
import { PageSection } from "./page-section"

/**
 * "Lesson materials since the previous control": what teachers added to lessons after the previous control of this
 * subject (all of it if there was none) up to today. EMIS materials and topics are wrong too often, so only IHSP ones show.
 */
export function ExamMaterials({ item, exams }: { item: AssessmentItem; exams: AssessmentItem[] }) {
  const t = useT("exams.materials")
  const f = useFormatters()
  const labels = useExamLabels()
  const subject = useSubjectMaterials(item.subject.id)
  const previous = previousControl(exams, item)
  const hint = previous
    ? t("sinceDate", {
        control: labels.control(previous),
        date: f.date(previous.date, { day: "numeric", month: "short" }),
      })
    : t("sinceStart")
  return (
    <PageSection title={t("title")} hint={hint}>
      <QueryState query={subject} rows={3}>
        {(detail) => {
          const entries = materialsSince(detail, previous, todayIso())
          if (entries.length === 0) return <p className="text-muted-foreground text-sm">{t("empty")}</p>
          return (
            <ul className="flex flex-col gap-2">
              {entries.map(({ material, lesson }) => (
                <li
                  key={material.link_id}
                  className="flex min-h-11 items-center gap-3 rounded-lg border p-2"
                  data-testid="exam-material"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{material.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      <Link href={lessonHref(lesson.id)} className="underline-offset-4 hover:underline">
                        {t("lesson", { date: f.date(lesson.date, { day: "numeric", month: "short" }) })}
                      </Link>
                      {lesson.topic && lesson.topic_source !== "emis" ? (
                        <>
                          {" · "}
                          <span>{lesson.topic}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <LinkButton
                    href={material.short_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                    aria-label={t("openItem", { title: material.title })}
                  >
                    {t("open")}
                  </LinkButton>
                </li>
              ))}
            </ul>
          )
        }}
      </QueryState>
    </PageSection>
  )
}
