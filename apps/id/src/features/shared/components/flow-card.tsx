import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@ihsp/ui"
import type { ReactNode } from "react"

type FlowCardProps = {
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

/** The card every login-app page is made of: one `h1`, optional description, body and footer links. */
export function FlowCard({ title, description, children, footer }: FlowCardProps) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl leading-tight font-semibold tracking-tight">{title}</h1>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? <CardContent className="grid gap-4">{children}</CardContent> : null}
      {footer ? <CardFooter className="flex-col items-stretch gap-2">{footer}</CardFooter> : null}
    </Card>
  )
}
