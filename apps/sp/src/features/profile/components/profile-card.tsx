import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useId, type ReactNode } from "react"

/** A titled card of the Profile page. */
export function ProfileCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle id={id}>{title}</CardTitle>
          {action}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}
