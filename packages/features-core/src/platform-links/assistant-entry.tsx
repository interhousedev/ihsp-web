"use client";

import type { Role } from "@ihsp/api";
import { useAuthStore } from "@ihsp/auth";
import { getConfig } from "@ihsp/config";
import { useT } from "@ihsp/i18n";
import { AiEntryButton } from "@ihsp/ui";

/** Where the user's assistant lives for apps without one of their own: the student portal, Staff or Admin by role. */
export function assistantUrlFor(
  roles: readonly Role[] | undefined,
): string | null {
  if (!roles) return null;
  const config = getConfig();
  const base = roles.includes("student")
    ? config.SP_URL
    : roles.includes("teacher")
      ? config.STAFF_URL
      : roles.includes("admin")
        ? config.ADMIN_URL
        : "";
  return base ? `${base.replace(/\/+$/, "")}/assistant/` : null;
}

/**
 * The AI entry of the app header, the same in every app. `href` is the app's own assistant page; `onClick` opens an
 * assistant dock; with neither it goes to the assistant of the user's home app (LMS, Library).
 */
export function AssistantEntry({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const t = useT();
  const roles = useAuthStore((state) => state.user?.roles);
  const target = href ?? (onClick ? undefined : assistantUrlFor(roles));
  if (!onClick && !target) return null;
  return (
    <AiEntryButton
      label={t("common.aiAssistant")}
      href={target ?? undefined}
      onClick={onClick}
    />
  );
}
