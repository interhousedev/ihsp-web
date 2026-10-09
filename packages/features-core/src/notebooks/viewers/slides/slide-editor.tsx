"use client"

import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, Textarea } from "@ihsp/ui"
import type { ReactNode } from "react"
import { BulletsEditor } from "./bullets-editor"

type SlideEditorProps = {
  slide: Slide
  /** 1-based position, for the heading. */
  number: number
  onPatch: (patch: Partial<Slide>) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </label>
  )
}

const TEXT_LAYOUTS: readonly Slide["layout"][] = ["title", "section", "bullets", "summary"]

/** Edit fields for the selected slide; which ones appear depends on its layout. The stage above shows the result. */
export function SlideEditor({ slide, number, onPatch }: SlideEditorProps) {
  const t = useT("notebooks.slides")
  const textual = TEXT_LAYOUTS.includes(slide.layout)
  const { left, right, quote } = slide

  return (
    <section
      aria-label={t("editorTitle", { n: number })}
      className="bg-card flex flex-col gap-4 rounded-xl border p-3 md:p-4"
    >
      <h3 className="text-sm font-semibold">{t("editorTitle", { n: number })}</h3>

      <Field label={t("field.title")}>
        <Input
          value={slide.title}
          className="h-11 md:h-9"
          onChange={(event) => onPatch({ title: event.target.value })}
        />
      </Field>

      {textual ? (
        <>
          <BulletsEditor
            legend={t("field.bullets")}
            bullets={slide.bullets ?? []}
            itemLabel={(n) => t("field.bullet", { n })}
            removeLabel={(n) => t("field.removeBullet", { n })}
            addLabel={t("field.addBullet")}
            onChange={(bullets) => onPatch({ bullets })}
          />
          <Field label={t("field.body")}>
            <Textarea value={slide.body ?? ""} rows={2} onChange={(event) => onPatch({ body: event.target.value })} />
          </Field>
        </>
      ) : null}

      {quote ? (
        <>
          <Field label={t("field.quote")}>
            <Textarea
              value={quote.text}
              rows={2}
              onChange={(event) => onPatch({ quote: { ...quote, text: event.target.value } })}
            />
          </Field>
          <Field label={t("field.attribution")}>
            <Input
              value={quote.attribution ?? ""}
              className="h-11 md:h-9"
              onChange={(event) => onPatch({ quote: { ...quote, attribution: event.target.value || null } })}
            />
          </Field>
        </>
      ) : null}

      {left && right ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <Field label={t("field.leftHeading")}>
              <Input
                value={left.heading}
                className="h-11 md:h-9"
                onChange={(event) => onPatch({ left: { ...left, heading: event.target.value } })}
              />
            </Field>
            <BulletsEditor
              legend={left.heading || t("field.bullets")}
              bullets={left.bullets}
              itemLabel={(n) => t("field.leftBullet", { n })}
              removeLabel={(n) => t("field.removeBullet", { n })}
              addLabel={t("field.addBullet")}
              onChange={(bullets) => onPatch({ left: { ...left, bullets } })}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <Field label={t("field.rightHeading")}>
              <Input
                value={right.heading}
                className="h-11 md:h-9"
                onChange={(event) => onPatch({ right: { ...right, heading: event.target.value } })}
              />
            </Field>
            <BulletsEditor
              legend={right.heading || t("field.bullets")}
              bullets={right.bullets}
              itemLabel={(n) => t("field.rightBullet", { n })}
              removeLabel={(n) => t("field.removeBullet", { n })}
              addLabel={t("field.addBullet")}
              onChange={(bullets) => onPatch({ right: { ...right, bullets } })}
            />
          </div>
        </div>
      ) : null}

      <Field label={t("field.visualHint")}>
        <Input
          value={slide.visual_hint ?? ""}
          className="h-11 md:h-9"
          onChange={(event) => onPatch({ visual_hint: event.target.value || null })}
        />
      </Field>

      <Field label={t("notes")}>
        <Textarea value={slide.notes} rows={3} onChange={(event) => onPatch({ notes: event.target.value })} />
      </Field>
    </section>
  )
}
