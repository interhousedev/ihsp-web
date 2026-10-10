"use client";

import { getMeProfileQuery } from "@ihsp/api";
import { useSession } from "@ihsp/auth";
import { getConfig } from "@ihsp/config";
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core";
import { useT } from "@ihsp/i18n";
import { useQuery } from "@tanstack/react-query";

export type StepId = "telegram" | "subgroup" | "notifications";

export type Step = {
  id: StepId;
  done: boolean;
  hint: string | null;
  href: string;
};

/** The onboarding steps (UF-WEB-01) that are still open, and how to dismiss them; null before the data is in. */
export function useGetStarted(): {
  steps: Step[];
  open: Step[];
  dismissed: string[];
  dismiss: (ids: StepId[]) => void;
} | null {
  const { session } = useSession();
  const preferences = usePreferences();
  const profile = useQuery(getMeProfileQuery());
  const update = useUpdatePreferences();
  const t = useT("today.getStarted");

  if (!session || !preferences || profile.isPending) return null;

  const dismissed = preferences.onboarding_dismissed;
  const subgroup = profile.data?.subgroup ?? null;
  const steps: Step[] = [
    {
      id: "telegram",
      done: session.user.telegram.length > 0,
      hint: null,
      href: `${getConfig().ID_URL}/security/telegram/`,
    },
    {
      id: "subgroup",
      done: subgroup !== null,
      hint:
        subgroup !== null
          ? t("subgroupSet", { number: subgroup })
          : t("subgroupUnset"),
      href: "/profile/",
    },
    { id: "notifications", done: false, hint: null, href: "/settings/" },
  ];
  const open = steps.filter(
    (step) => !step.done && !dismissed.includes(step.id),
  );
  const dismiss = (ids: StepId[]) => {
    update.mutate({
      onboarding_dismissed: [...new Set([...dismissed, ...ids])],
    });
  };
  return { steps, open, dismissed, dismiss };
}
