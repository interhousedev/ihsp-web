import { cn } from "@ihsp/ui"

/** Read-only chips of the student's tags. */
export function TagChips({ tags, className }: { tags: { key: string; label: string }[]; className?: string }) {
  return (
    <ul className={cn("flex min-w-0 flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li
          key={tag.key}
          className="border-primary bg-primary/10 max-w-full min-w-fit rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap"
        >
          {tag.label}
        </li>
      ))}
    </ul>
  )
}
