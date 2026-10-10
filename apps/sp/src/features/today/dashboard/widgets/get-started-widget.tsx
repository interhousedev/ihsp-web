"use client";

import { useT } from "@ihsp/i18n";
import { useGetStarted } from "../../hooks/use-get-started";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";
import { BigNumber, Lines } from "./shared";

/** The first-visit steps still open (Telegram, subgroup, notifications); "all set" once none is left. */
export function GetStartedWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.getStarted");
  const d = useT("today.dashboard");
  const state = useGetStarted();
  const open = state?.open ?? [];
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("title")}
      href={open[0]?.href ?? "/settings/"}
    >
      {open.length === 0 ? (
        <span className="text-sm">{d("allSet")}</span>
      ) : widget.size === "2x1" ? (
        <BigNumber value={open.length} label={d("stepsLeft")} />
      ) : (
        <Lines items={open.map((step) => t(`steps.${step.id}.title`))} />
      )}
    </WidgetFrame>
  );
}
