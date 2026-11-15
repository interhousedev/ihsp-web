"use client"

import { BRAND } from "@ihsp/config/brand"
import { QueryState } from "@ihsp/features-core"
import { useLocaleStore, useT } from "@ihsp/i18n"
import type { RecordBook } from "@ihsp/api"
import { Button, IconFileTypePdf, IconShare } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useCurriculum } from "../../subjects/hooks/use-curriculum"
import { useAccount, useProfile } from "../../profile/hooks/use-profile"
import { useRecordBook } from "../hooks/use-grades"
import { type BookFields, bookFields, bookLines, paginate } from "../utils/rating-book"

/** A4 at 96 dpi. */
const PAGE_W = 794
const PAGE_H = 1123

const PRINT_CSS = `
@page { size: A4; margin: 0 }
@media print {
  body * { visibility: hidden }
  #rating-book-doc, #rating-book-doc * { visibility: visible }
  #rating-book-doc { position: absolute; left: 0; top: 0; width: 210mm; height: auto !important }
  #rating-book-doc .rb-scale { transform: none !important; width: 210mm !important }
  #rating-book-doc .rb-page { break-after: page; box-shadow: none !important; margin: 0 !important }
}`

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-2 text-[13px]">
      <span className="shrink-0">{label}:</span>
      <span className="min-w-0 flex-1 border-b border-black px-1 font-medium">{value}</span>
    </div>
  )
}

function Header({ fields }: { fields: BookFields }) {
  const t = useT("grades.ratingBook")
  return (
    <>
      <div className="flex items-center gap-4 text-center">
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
        <img src={BRAND.logos.svg} alt="" width={64} height={64} />
        <p className="flex-1 text-[11px] leading-snug uppercase">{t("doc.ministry")}</p>
      </div>
      <h2 className="mt-5 text-center text-xl font-bold">{t("doc.title")}</h2>
      <div className="mt-4 flex flex-col gap-2">
        <Field label={t("doc.institution")} value={BRAND.orgName} />
        <Field label={t("doc.student")} value={fields.student} />
        <Field label={t("doc.group")} value={fields.group} />
        <Field label={t("doc.speciality")} value={fields.speciality} />
        <Field label={t("doc.educationType")} value={fields.educationType} />
        <Field label={t("doc.form")} value={fields.form} />
        <Field label={t("doc.course")} value={fields.course} />
        <Field label={t("doc.language")} value={fields.language} />
        <Field label={t("doc.academicYear")} value={fields.academicYear} />
      </div>
    </>
  )
}

function BookTable({ lines }: { lines: ReturnType<typeof bookLines> }) {
  const t = useT("grades.ratingBook")
  return (
    <table className="mt-4 w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="w-14 border border-black p-1">{t("doc.number")}</th>
          <th className="border border-black p-1">{t("doc.subjects")}</th>
          <th className="w-20 border border-black p-1">{t("doc.mark")}</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) =>
          line.kind === "band" ? (
            <tr key={`s${line.semester}`}>
              <td colSpan={3} className="border border-black bg-black/10 p-1 text-center font-semibold">
                {t("doc.semester", { number: line.semester })}
              </td>
            </tr>
          ) : (
            <tr key={`r${index}`}>
              <td className="border border-black p-1 text-center">{line.number}</td>
              <td className="border border-black p-1">{line.subject}</td>
              <td className="border border-black p-1 text-center">{line.mark}</td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  )
}

/** The rating book as paginated A4 pages, scaled down to the width of the screen; print gives the real pages. */
function Pages({ book, fields }: { book: RecordBook; fields: BookFields }) {
  const t = useT("grades.ratingBook")
  const pages = paginate(bookLines(book))
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const node = box.current
    if (!node) return
    const fit = () => setScale(Math.min(1, node.clientWidth / PAGE_W) || 1)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={box} id="rating-book-doc" className="w-full" style={{ height: pages.length * (PAGE_H + 16) * scale }}>
      <style>{PRINT_CSS}</style>
      <div className="rb-scale origin-top-left" style={{ width: PAGE_W, transform: `scale(${scale})` }}>
        {pages.map((lines, index) => (
          <section
            // oxlint-disable-next-line react/no-array-index-key -- pages have no identity
            key={index}
            className="rb-page mb-4 bg-white p-10 text-black shadow-md"
            style={{ width: PAGE_W, height: PAGE_H }}
            data-testid="rating-book-page"
          >
            {index === 0 ? <Header fields={fields} /> : null}
            <BookTable lines={lines} />
            <p className="mt-2 text-right text-[11px]">{t("doc.page", { page: index + 1, total: pages.length })}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

function Actions() {
  const t = useT("grades.ratingBook")
  async function share() {
    const url = `${window.location.origin}/grades/?tab=book`
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("doc.title"), url })
      } catch {
        // cancelled by the user
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("copied"))
    } catch {
      toast.error(t("shareError"))
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="min-h-11 md:min-h-8" onClick={() => window.print()}>
        <IconFileTypePdf aria-hidden />
        {t("download")}
      </Button>
      <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => void share()}>
        <IconShare aria-hidden />
        {t("share")}
      </Button>
    </div>
  )
}

/** The rating book (Reyting daftarcha) of the student, from the record book, profile and curriculum. */
export function RatingBookDocument() {
  const t = useT("grades.ratingBook")
  const locale = useLocaleStore((state) => state.locale)
  const query = useRecordBook()
  const profile = useProfile()
  const curriculum = useCurriculum()
  const account = useAccount()
  const fields = bookFields(profile.data, curriculum.data, locale, account.data?.middle_name)
  return (
    <QueryState query={query} isEmpty={(book) => book.semesters.length === 0} emptyText={t("empty")} rows={4}>
      {(book) => (
        <div className="flex flex-col gap-3">
          <Actions />
          <Pages book={book} fields={fields} />
        </div>
      )}
    </QueryState>
  )
}
