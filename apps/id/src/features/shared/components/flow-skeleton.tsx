import { Card, CardContent, CardHeader, Skeleton } from "@ihsp/ui"

/** Loading state of a flow card (also the `<Suspense>` fallback of every page that reads the query string). */
export function FlowSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="grid gap-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  )
}
