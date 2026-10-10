"use client";

import type { MindMapNode, RefsIndex } from "@ihsp/api";
import { useT } from "@ihsp/i18n";
import { Button, cn } from "@ihsp/ui";
import { IconBook2, IconMessageCircleQuestion } from "@ihsp/ui";
import type { ReactNode } from "react";
import { useNodeActions } from "./use-node-actions";

type MindMapNodeActionsProps = {
  node: MindMapNode;
  refsIndex: RefsIndex;
  /** `sm` for the dense outline rows. */
  size?: "default" | "sm";
  /** Runs after Ask in chat (the details close because the chat takes over). */
  onAsked?: () => void;
  /** Extra buttons after the two actions. */
  children?: ReactNode;
  className?: string;
};

/** **Ask in chat** and **Show sources** for one node (the details card, the phone sheet and the outline rows). */
export function MindMapNodeActions({
  node,
  refsIndex,
  size = "default",
  onAsked,
  children,
  className,
}: MindMapNodeActionsProps) {
  const t = useT("notebooks");
  const { hasSources, askAbout, showSources, shared } =
    useNodeActions(refsIndex);
  const touch = size === "sm" ? "min-h-11 md:min-h-7" : "min-h-11 md:min-h-8";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {shared ? null : (
        <>
          <Button
            type="button"
            size={size === "sm" ? "sm" : "default"}
            className={touch}
            onClick={() => {
              askAbout(node);
              onAsked?.();
            }}
          >
            <IconMessageCircleQuestion aria-hidden />
            {t("mindmap.ask")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            className={touch}
            disabled={!hasSources(node)}
            onClick={() => showSources(node)}
          >
            <IconBook2 aria-hidden />
            {t("mindmap.sources")}
          </Button>
        </>
      )}
      {children}
    </div>
  );
}
