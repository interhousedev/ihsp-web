"use client"

import type { PublicStudentCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PersonSilhouette, QrCode } from "@ihsp/ui"

/** A graduation cap, the mark of the card's top-right corner. */
function GraduationCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M22 9 12 4 2 9l10 5 10-5Z" strokeLinejoin="round" />
      <path d="M6 11v5c3 2.5 9 2.5 12 0v-5" strokeLinejoin="round" />
      <path d="M22 9v6" strokeLinecap="round" />
    </svg>
  )
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[0.65rem] font-semibold tracking-widest text-white/55 uppercase">{label}</dt>
      <dd className="text-sm font-medium break-words">{value}</dd>
    </div>
  )
}

/**
 * The student card as a dark navy ID: lyceum logo and full name, the student's name, year and photo (a gray
 * silhouette without one), group, student ID and speciality, and the QR code of `qrValue` with the ID under it.
 */
export function StudentIdCard({
  card,
  logoSrc,
  photoUrl,
  qrValue,
}: {
  card: PublicStudentCard
  logoSrc: string
  photoUrl: string | null
  qrValue: string
}) {
  const t = useT("studentCard")
  const fields: [string, string | number | null][] = [
    [t("group"), card.group],
    [t("studentId"), card.student_id],
    [t("speciality"), card.speciality],
  ]
  return (
    <article
      data-testid="student-id-card"
      className="flex w-full flex-col gap-5 rounded-3xl bg-[#0f1f3d] p-5 text-left text-white shadow-lg"
    >
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file or URL */}
          <img data-testid="card-lyceum-logo" src={logoSrc} alt="" className="size-full object-contain" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-snug font-medium text-white/85">{card.org_name}</p>
        <GraduationCap className="size-7 shrink-0 text-white/80" />
      </header>
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-white/55 uppercase">{t("label")}</p>
          <h2 className="text-xl leading-tight font-bold break-words">{card.full_name}</h2>
          <p className="text-sm text-white/70">{card.academic_year}</p>
        </div>
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-white/10">
          {photoUrl ? (
            // oxlint-disable-next-line nextjs/no-img-element -- static export; the photo is an API image
            <img data-testid="card-photo" src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <PersonSilhouette className="rounded-xl" />
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields
          .filter(([, value]) => value !== null && value !== "")
          .map(([label, value]) => (
            <Field key={label} label={label} value={value as string | number} />
          ))}
      </dl>
      <div className="flex flex-col items-center gap-2">
        <div data-testid="card-qr" data-card-url={qrValue} className="rounded-2xl bg-white p-3 text-black">
          <QrCode value={qrValue} label={t("qrLabel")} />
        </div>
        {card.student_id ? <p className="font-mono text-sm tracking-wider text-white/80">{card.student_id}</p> : null}
      </div>
    </article>
  )
}
