import { cn, Icons } from "@ihsp/ui"
import { PageHeader, type PageHeaderProps } from "@ihsp/ui"
import type { ReactNode } from "react"

const WIDTHS = { narrow: "max-w-3xl", default: "max-w-4xl", wide: "max-w-6xl" } as const

/** The class of every page body: one max-width scale, generous padding and spacing between sections. */
export function pageClass(width: keyof typeof WIDTHS = "narrow", extra?: string) {
  return cn("mx-auto flex w-full min-w-0 flex-col gap-8 px-4 py-6 md:gap-10 md:px-8 md:py-10", WIDTHS[width], extra)
}

/** The page title with a tinted icon tile before it: the one header pattern of every page. */
export function AppPageHeader({ icon, ...props }: Omit<PageHeaderProps, "back"> & { icon: keyof typeof Icons }) {
  const Icon = Icons[icon]
  return (
    <PageHeader
      {...props}
      back={
        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <Icon aria-hidden className="size-5" />
        </span>
      }
    />
  )
}

/** A titled block of a page: heading row (with optional actions) and the content below it. */
export function PageSection({
  title,
  actions,
  children,
  className,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** A number with a caption and an optional thin bar showing its share of `max`. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  progress,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: keyof typeof Icons
  /** 0-100: the filled share of the bar under the value. */
  progress?: number
  className?: string
}) {
  const Icon = icon ? Icons[icon] : null
  return (
    <div className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-5", className)}>
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        {Icon ? (
          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
            <Icon aria-hidden className="size-4" />
          </span>
        ) : null}
        <span className="min-w-0">{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {progress === undefined ? null : <Bar value={progress} />}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  )
}

/** Stat cards in a responsive grid. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>{children}</div>
}

/** Bar colour by score: green from 80, amber from 40, red below. */
export function scoreTone(value: number): string {
  return value >= 80 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-destructive"
}

function Bar({ value, className, tone }: { value: number; className?: string; tone?: string }) {
  const percent = Math.max(0, Math.min(100, value))
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("bg-muted h-1.5 overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          tone ?? "bg-primary",
          " h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/** Labelled horizontal bars: a compact table of shares (readiness components, score breakdowns). */
export function BarList({
  items,
  toned,
  className,
}: {
  items: { key: string; label: ReactNode; value: number; display?: ReactNode; footer?: ReactNode }[]
  /** Colour each bar by its score instead of the primary colour. */
  toned?: boolean
  className?: string
}) {
  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">{item.label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">{item.display ?? `${item.value}%`}</span>
          </div>
          <Bar value={item.value} tone={toned ? scoreTone(item.value) : undefined} />
          {item.footer}
        </li>
      ))}
    </ul>
  )
}

/** A circular percentage with an optional caption under the number. */
export function ProgressRing({
  percent,
  label,
  size = 128,
  className,
}: {
  percent: number
  label: string
  size?: number
  className?: string
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const value = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  )
}

export type DataColumn<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Right-align numeric columns. */
  numeric?: boolean
  className?: string
}

/** A plain responsive table: bordered card, hairline rows, muted header. Rows may link via `rowHref`. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  empty,
  className,
}: {
  columns: DataColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  label: string
  empty?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("bg-card rounded-card overflow-x-auto border", className)}>
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="text-muted-foreground bg-muted/40 text-xs font-medium">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-4 py-3", column.numeric && "text-right", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className="text-muted-foreground px-4 py-6 text-center">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-muted/30 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3", column.numeric && "text-right tabular-nums", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
