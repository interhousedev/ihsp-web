import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ihsp/ui"
import Link from "next/link"
import type { ComponentType, ReactNode } from "react"

type SecurityCardProps = {
  href: string
  title: string
  description?: string
  icon: ComponentType<{ className?: string }>
  /** A badge or short status shown under the title. */
  status?: ReactNode
  destructive?: boolean
}

/** One tile of the security overview; the whole tile is a link (at least 44 px tall). */
export function SecurityCard({ href, title, description, icon: Icon, status, destructive }: SecurityCardProps) {
  return (
    <Link href={href} className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3">
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardHeader className="flex-row items-start gap-3">
          <Icon className={`mt-0.5 size-5 shrink-0 ${destructive ? "text-destructive" : "text-muted-foreground"}`} />
          <div className="grid min-w-0 gap-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        {status ? <CardContent>{status}</CardContent> : null}
      </Card>
    </Link>
  )
}
