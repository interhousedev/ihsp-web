import { BRAND } from "@ihsp/config/brand"
import { cn, type Icon } from "@ihsp/ui"
import {
  IconBell,
  IconBook,
  IconBooks,
  IconCalendarWeek,
  IconCertificate,
  IconChecklist,
  IconHome,
  IconLayoutSidebar,
  IconNotebook,
  IconSchool,
  IconSearch,
  IconSparkles,
  IconUserCheck,
} from "@ihsp/ui"
import type { ReactNode } from "react"

export type DemoKey = (key: string) => string

/** Subjects, rooms and teachers of the demo lyceum: the same world as the `packages/test-utils` fixtures. */
export const LESSONS = [
  { time: "08:30", subject: "math", room: "101", teacher: "Usmonov B." },
  { time: "10:10", subject: "physics", room: "204", teacher: "Usmonov B." },
  { time: "12:10", subject: "english", room: "101", teacher: "Karimova N." },
  { time: "13:40", subject: "russian", room: "204", teacher: "Karimova N." },
  { time: "15:10", subject: "uzbek", room: "101", teacher: "Saidova M." },
] as const

export const MARKS = [
  { subject: "math", mark: 5 },
  { subject: "physics", mark: 4 },
  { subject: "english", mark: 5 },
  { subject: "chemistry", mark: 4 },
  { subject: "history", mark: 3 },
  { subject: "biology", mark: 5 },
] as const

export const NAV: Record<string, Icon> = {
  home: IconHome,
  calendar: IconCalendarWeek,
  marks: IconCertificate,
  tasks: IconChecklist,
  journal: IconNotebook,
  library: IconBooks,
  courses: IconSchool,
  assistant: IconSparkles,
  attendance: IconUserCheck,
  subjects: IconBook,
}

/** The page of a screen: fills the device viewport, no scroll. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-background text-foreground flex h-full w-full flex-col", className)}>{children}</div>
}

/** The top bar of the apps on phones and tablets: sidebar toggle, search, notifications, avatar. */
export function TopBar({ initials, unread }: { initials: string; unread?: number }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 px-4">
      <IconLayoutSidebar className="size-5" aria-hidden />
      <span className="flex-1" />
      <IconSearch className="size-5" aria-hidden />
      <span className="relative">
        <IconBell className="size-5" aria-hidden />
        {unread ? (
          <span className="bg-foreground text-background absolute -top-2 -right-2 grid size-4 place-items-center rounded-full text-[10px] font-semibold">
            {unread}
          </span>
        ) : null}
      </span>
      <span className="bg-muted grid size-8 place-items-center rounded-full text-xs font-medium">{initials}</span>
    </div>
  )
}

export function BottomNav({ items, active }: { items: { key: string; label: string }[]; active: string }) {
  return (
    <nav className="bg-background mt-auto flex h-16 shrink-0 items-stretch border-t px-2 pb-1">
      {items.map(({ key, label }) => {
        const NavIcon = NAV[key] ?? IconHome
        return (
          <span
            key={key}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              key === active ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            <NavIcon className="size-5" aria-hidden />
            {label}
          </span>
        )
      })}
    </nav>
  )
}

/** The sidebar of the apps on laptops. */
export function SideNav({
  items,
  active,
  name,
}: {
  items: { key: string; label: string }[]
  active: string
  name: string
}) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground flex w-52 shrink-0 flex-col gap-1 border-r p-3">
      <div className="mb-3 flex items-center gap-2 px-2 py-1.5">
        <img src={BRAND.logos.svg} alt="" className="size-6" />
        <span className="text-sm font-semibold">{name}</span>
      </div>
      {items.map(({ key, label }) => {
        const NavIcon = NAV[key] ?? IconHome
        return (
          <span
            key={key}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px]",
              key === active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground",
            )}
          >
            <NavIcon className="size-4" aria-hidden />
            {label}
          </span>
        )
      })}
    </aside>
  )
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-2xl font-bold tracking-tight">{children}</p>
      {action}
    </div>
  )
}
