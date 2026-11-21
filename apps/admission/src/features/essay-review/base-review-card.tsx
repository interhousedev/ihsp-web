"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import type { BaseReview } from "./api"

const REVIEW_DIMS = ["responsiveness", "hook", "theme", "detail", "voice", "authenticity", "reflection", "writing"] as const

/** The review of the essay itself; it is the same for every university, so it is shown once. */
export function BaseReviewCard({ review, stale }: { review: BaseReview; stale: boolean }) {
  const t = useT("essayReview")
  return (
    <Card data-testid="base-review">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {t("base.title")}
          <Badge variant="secondary">{review.score}/100</Badge>
          {stale ? <Badge variant="outline">{t("stale")}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p>{review.summary}</p>
        <ul aria-label={t("base.criteria")} className="flex flex-col gap-1">
          {review.dimensions.map((dimension) => (
            <li key={dimension.key} className="flex flex-wrap gap-x-2">
              <span className="font-medium">
                {(REVIEW_DIMS as readonly string[]).includes(dimension.key)
                  ? t(`base.dim.${dimension.key as (typeof REVIEW_DIMS)[number]}`)
                  : dimension.key}
              </span>
              <span className="text-muted-foreground">{dimension.score}/5</span>
              <span>{dimension.comment}</span>
            </li>
          ))}
        </ul>
        <List title={t("base.strengths")} items={review.strengths} />
        <List title={t("base.improvements")} items={review.improvements} />
      </CardContent>
    </Card>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
