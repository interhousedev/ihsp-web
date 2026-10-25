import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ihsp/ui"
import { useId, type ReactNode } from "react"

/** A titled card of the Settings page. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardHeader>
          <CardTitle id={id}>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}
