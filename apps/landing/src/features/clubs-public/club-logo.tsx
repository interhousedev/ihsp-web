/** Round-cornered monogram of a club. */
export function ClubLogo({ name, hue, size = "size-12 text-base" }: { name: string; hue: number; size?: string }) {
  return (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-2xl font-bold text-white`}
      style={{ background: `oklch(0.58 0.14 ${hue})` }}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}
