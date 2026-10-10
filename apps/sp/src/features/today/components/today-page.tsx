"use client";

import { useFormatters, useT } from "@ihsp/i18n";
import { PageContainer } from "@ihsp/ui";
import { usePreferences } from "@ihsp/features-core";
import type { ReactNode } from "react";
import { Dashboard } from "../dashboard/dashboard";
import { QueryState } from "../../shared/components/query-state";
import { useNow } from "../../shared/hooks/use-now";
import { useAlerts, useAnnouncements, useToday } from "../hooks/use-today";
import { useStickyList } from "../hooks/use-sticky-list";
import { visibleTodayCards, type TodayCardId } from "../utils/today-cards";
import { AlertsCard } from "./alerts-card";
import { AnnouncementsCard } from "./announcements-card";
import { DueCard } from "./due-card";
import { ExamCountdownCard } from "./exam-countdown-card";
import { GetStartedCard } from "./get-started-card";
import { NewMarksCard } from "./new-marks-card";
import { NowNextCard } from "./now-next-card";
import { SemesterCard } from "./semester-card";
import { TimelineCard } from "./timeline-card";

/** Today (WEB-3, UF-WEB-01, UF-WEB-02): a dashboard of cards in the order the student chose; hidden cards are left out. */
export function TodayPage() {
  const t = useT("today");
  const f = useFormatters();
  const now = useNow(60_000);
  const preferences = usePreferences();
  const today = useToday();
  const alerts = useAlerts();
  const announcements = useAnnouncements();
  const newMarks = useStickyList(today.data?.new_marks);

  const order = visibleTodayCards(preferences?.today_cards ?? []);

  return (
    <PageContainer
      title={t("title")}
      description={f.date(now, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    >
      <Dashboard />
      <GetStartedCard />
      <ExamCountdownCard />
      <QueryState query={today}>
        {(data) => {
          const cards: Record<TodayCardId, ReactNode> = {
            now: <NowNextCard today={data} loadedAt={today.dataUpdatedAt} />,
            timeline:
              data.lessons.length > 0 ? <TimelineCard today={data} /> : null,
            due: data.due.length > 0 ? <DueCard today={data} /> : null,
            marks:
              newMarks.length > 0 ? (
                <NewMarksCard marks={[...newMarks]} />
              ) : null,
            semester:
              data.semester.semester !== null ? (
                <SemesterCard today={data} alerts={alerts.data ?? []} />
              ) : null,
            announcements:
              announcements.data && announcements.data.items.length > 0 ? (
                <AnnouncementsCard items={announcements.data.items} />
              ) : null,
            alerts:
              alerts.data && alerts.data.length > 0 ? (
                <AlertsCard alerts={alerts.data} />
              ) : null,
          };
          return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {order.map((id) => (
                <div key={id} className="contents">
                  {cards[id]}
                </div>
              ))}
            </div>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
