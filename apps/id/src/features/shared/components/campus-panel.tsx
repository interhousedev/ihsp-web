"use client"

import { BRAND } from "@ihsp/config/brand"
import { useTr } from "@ihsp/features-core/id-account"

/**
 * The right half of the split layout: a photo of the lyceum campus under a dark gradient with the logo and the Latin
 * motto. Hidden below `lg`. The photo is a plain file of /public (static export, no image optimizer).
 * Source: Wikimedia Commons, "International House-Tashkent academic lyceum Under TIIAME National Research
 * University.jpg" by RASH.IHT, CC BY-SA 4.0.
 */
export function CampusPanel() {
  const t = useTr()
  return (
    <aside className="relative isolate hidden overflow-hidden lg:block" data-testid="campus-panel">
      {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the photo is a plain file of /public */}
      <img src="/campus.webp" alt={t("splitPanel.photoAlt")} className="absolute inset-0 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
      <div className="relative flex h-full flex-col justify-between p-10 text-white">
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
        <img src={BRAND.logos.svg} alt="" width={48} height={48} className="size-12 rounded-xl shadow-lg" />
        <figure className="grid gap-2">
          <blockquote className="font-serif text-3xl leading-tight font-semibold italic">
            {t("splitPanel.motto")}
          </blockquote>
          <figcaption className="text-sm text-white/80">{t("splitPanel.mottoTranslation")}</figcaption>
        </figure>
        <a
          href="https://commons.wikimedia.org/wiki/File:International_House-Tashkent_academic_lyceum_Under_TIIAME_National_Research_University.jpg"
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 bottom-3 text-[10px] text-white/50 hover:text-white/80"
        >
          © RASH.IHT, CC BY-SA 4.0
        </a>
      </div>
    </aside>
  )
}
