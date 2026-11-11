import type { Locale } from "@ihsp/i18n"

type FlagProps = { className?: string }

/** Small inline SVG flags: emoji flags do not render on Windows. Decorative, the button carries the name. */
function Uzbekistan({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className={className}>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5" fill="#1eb4e6" />
      <rect y="11" width="24" height="5" fill="#1eb53a" />
      <rect y="5" width="24" height="1" fill="#ce1126" />
      <rect y="10" width="24" height="1" fill="#ce1126" />
      <circle cx="5" cy="2.5" r="1.6" fill="#fff" />
      <circle cx="5.8" cy="2.5" r="1.4" fill="#1eb4e6" />
      <circle cx="9" cy="1.7" r=".4" fill="#fff" />
      <circle cx="11" cy="1.7" r=".4" fill="#fff" />
      <circle cx="10" cy="3.4" r=".4" fill="#fff" />
    </svg>
  )
}

function Russia({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className={className}>
      <rect width="24" height="16" fill="#fff" />
      <rect y="5.33" width="24" height="5.34" fill="#0039a6" />
      <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
    </svg>
  )
}

function UnitedKingdom({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className={className}>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5.4" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.2" />
    </svg>
  )
}

export const FLAGS: Record<Locale, (props: FlagProps) => React.JSX.Element> = {
  uz: Uzbekistan,
  ru: Russia,
  en: UnitedKingdom,
}
