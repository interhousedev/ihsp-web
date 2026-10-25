import { Fragment } from "react"
import { IconArrowRight } from "@ihsp/ui"
import { clamp, str } from "./safe"

/** Steps as boxes joined by arrows; wraps on narrow screens. */
export function FlowDiagram({ steps, title }: { steps: string[]; title?: string }) {
  const items = clamp(steps, 10)
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {title ? <p className="text-sm font-medium">{str(title)}</p> : null}
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((step, index) => (
          <Fragment key={index}>
            <li className="bg-muted rounded-md border px-3 py-2 text-sm break-words">{str(step)}</li>
            {index < items.length - 1 ? (
              <IconArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
            ) : null}
          </Fragment>
        ))}
      </ol>
    </div>
  )
}
