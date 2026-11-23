"use client"

import type { AiReviewTemplate } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"

/** A small, static sample of what the final review looks like in the template. */
export function TemplatePreview({ template }: { template: AiReviewTemplate }) {
  const t = useT("stepEditor")
  const rows = [t("aiReview.sample.structure"), t("aiReview.sample.evidence"), t("aiReview.sample.style")]
  if (template === "review_table") {
    return (
      <table className="w-full text-[11px]">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row} className="border-b last:border-0">
              <td className="py-0.5 pe-2">{row}</td>
              <td className="text-muted-foreground py-0.5 text-end tabular-nums">{[8, 6, 9][index]}/10</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  if (template === "rubric_checklist") {
    return (
      <ul className="flex flex-col gap-0.5 text-[11px]">
        {rows.map((row, index) => (
          <li key={row} className="flex items-center gap-1.5">
            {index === 1 ? (
              <Icons.circle aria-hidden className="text-muted-foreground size-3" />
            ) : (
              <Icons.circleCheck aria-hidden className="text-primary size-3" />
            )}
            {row}
          </li>
        ))}
      </ul>
    )
  }
  if (template === "strengths_cards") {
    return (
      <div className="grid grid-cols-2 gap-1 text-[11px]">
        <div className="border-success/40 bg-success/10 rounded border p-1">
          <p className="font-medium">{t("aiReview.sample.strengths")}</p>
          <p className="text-muted-foreground">{rows[0]}</p>
        </div>
        <div className="border-warning/40 bg-warning/10 rounded border p-1">
          <p className="font-medium">{t("aiReview.sample.improvements")}</p>
          <p className="text-muted-foreground">{rows[1]}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-1 text-[11px]">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex flex-col gap-0.5">
          <div className="bg-muted flex aspect-square items-center justify-center rounded">
            <Icons.media aria-hidden className="text-muted-foreground size-4" />
          </div>
          <p className="text-muted-foreground truncate">{rows[index]}</p>
        </div>
      ))}
    </div>
  )
}
