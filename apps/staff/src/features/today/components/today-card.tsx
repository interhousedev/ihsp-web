import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useId, type ReactNode } from "react"

/** The frame of one Today card: a titled section with an optional action on the right. */
export function TodayCard({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={className}>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle id={titleId} className="text-base">
            {title}
          </CardTitle>
          {action}
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-2">{children}</CardContent>
      </Card>
    </section>
  )
}
