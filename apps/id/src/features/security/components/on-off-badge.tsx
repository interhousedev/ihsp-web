import { Badge } from "@ihsp/ui"

export function OnOffBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return <Badge variant={on ? "secondary" : "outline"}>{on ? onLabel : offLabel}</Badge>
}
