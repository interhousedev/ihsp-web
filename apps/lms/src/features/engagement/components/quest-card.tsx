"use client"

import type { Quest } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Progress, cn } from "@ihsp/ui"
import { daysLeft, percent } from "../utils/engagement"

export type QuestCardProps = {
  quest: Quest
  /** Today's ISO date (Tashkent), for the days-left label. */
  today: string
  className?: string
}

/** A class quest: the learner's own goal and the whole class's shared goal. */
export function QuestCard({ quest, today, className }: QuestCardProps) {
  const t = useT("engagement")
  const left = daysLeft(quest.ends_on, today)
  return (
    <Card className={cn(quest.done && "border-primary", className)}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold">{quest.title}</h3>
            <p className="text-muted-foreground truncate text-xs">{quest.course_title}</p>
          </div>
          <Badge variant={quest.done ? "default" : "outline"} className="shrink-0">
            {quest.done ? t("quest.done") : left < 0 ? t("quest.ended") : t("quest.daysLeft", { count: left })}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span>{t(`quest.goal.${quest.goal_kind}`, { count: quest.target })}</span>
            <span className="tabular-nums">
              {Math.min(quest.my_progress, quest.target)}/{quest.target}
            </span>
          </div>
          <Progress value={percent(quest.my_progress, quest.target)} aria-label={t("quest.mine")} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{t("quest.class")}</span>
            <span className="tabular-nums">
              {Math.min(quest.class_progress, quest.class_target)}/{quest.class_target}
            </span>
          </div>
          <Progress value={percent(quest.class_progress, quest.class_target)} aria-label={t("quest.class")} />
        </div>
      </CardContent>
    </Card>
  )
}
