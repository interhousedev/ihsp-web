import type { CertQrStyle } from "@ihsp/api"

const N = 21

function finder(row: number, col: number): boolean | null {
  for (const [r0, c0] of [
    [0, 0],
    [0, N - 7],
    [N - 7, 0],
  ] as const) {
    const r = row - r0
    const c = col - c0
    if (r >= -1 && r <= 7 && c >= -1 && c <= 7) {
      if (r < 0 || r > 6 || c < 0 || c > 6) return false
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
    }
  }
  return null
}

/** A fixed pseudo-random 21×21 module pattern with the three finder squares: it looks like a QR, it is not one. */
const MODULES: boolean[][] = Array.from({ length: N }, (_, row) =>
  Array.from({ length: N }, (_, col) => finder(row, col) ?? (row * 7 + col * 13 + row * col) % 5 < 2),
)

/** The client-side look of the styled QR code while designing; the server preview draws the real one. */
export function QrSketch({ qr, className }: { qr: CertQrStyle; className?: string }) {
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill={qr.bg} rx={qr.style === "square" ? 0 : 1.5} />
      {MODULES.flatMap((row, r) =>
        row.map((on, c) => {
          if (!on) return null
          if (qr.style === "dots" && finder(r, c) === null)
            return <circle key={`${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={0.45} fill={qr.fg} />
          return (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1.02}
              height={1.02}
              rx={qr.style === "rounded" ? 0.35 : 0}
              fill={qr.fg}
            />
          )
        }),
      )}
    </svg>
  )
}
