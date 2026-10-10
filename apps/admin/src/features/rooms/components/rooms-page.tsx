"use client"

import { getAdminRoomsQuery, type Room } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, CopyButton, PageContainer } from "@ihsp/ui"
import { IconArchive, IconGitMerge, IconKey, IconPencil } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col } from "../../shared/utils/columns"
import { TOUCH_ICON } from "../../shared/utils/touch"
import { RoomDialogs, type RoomAction } from "./room-dialogs"

const FILTER_KEYS = ["status"] as const

/** The room page address without the PIN (`https://ihsu.uz/r/102`). */
function plainLink(url: string): string {
  return url.split("?")[0] ?? url
}

/** Rooms with their link, PIN and lessons this week; rename, regenerate PIN, merge and archive (ADM-19, UF-ADM-16). */
export function RoomsPage() {
  const t = useT("rooms")
  const filters = useFilterState(FILTER_KEYS)
  const [action, setAction] = useState<RoomAction | null>(null)
  const status =
    filters.values.status === "active" || filters.values.status === "archived" ? filters.values.status : undefined
  const rooms = useQuery(getAdminRoomsQuery({ status }))
  const source = useArrayList<Room>(rooms)

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: [
          { value: "active", label: t("status.active") },
          { value: "archived", label: t("status.archived") },
        ],
      },
    ],
    [t],
  )

  const columns = useMemo(
    () => [
      col<Room>("name", t("columns.name"), (room) => <span className="font-medium">{room.name}</span>),
      col<Room>("link", t("columns.link"), (room) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs break-all">{plainLink(room.url)}</span>
          <CopyButton value={room.url} label={t("copyLink")} size="sm" />
        </span>
      )),
      col<Room>("pin", t("columns.pin"), (room) => (
        <span className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-sm" aria-label={t("pinOf", { name: room.name })}>
            {room.pin}
          </Badge>
          <CopyButton value={room.pin} label={t("copyPin")} size="sm" />
        </span>
      )),
      col<Room>("lessons", t("columns.lessons"), (room) => room.lessons_this_week),
      col<Room>("status", t("columns.status"), (room) => <StatusBadge status={room.status} />),
      actionsCol<Room>(t("columns.actions"), (room) => (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={TOUCH_ICON}
            aria-label={t("actions.rename", { name: room.name })}
            onClick={() => setAction({ kind: "rename", room })}
          >
            <IconPencil aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={TOUCH_ICON}
            aria-label={t("actions.pin", { name: room.name })}
            disabled={room.status === "archived"}
            onClick={() => setAction({ kind: "pin", room })}
          >
            <IconKey aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={TOUCH_ICON}
            aria-label={t("actions.merge", { name: room.name })}
            disabled={room.status === "archived"}
            onClick={() => setAction({ kind: "merge", room })}
          >
            <IconGitMerge aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={TOUCH_ICON}
            aria-label={t("actions.archive", { name: room.name })}
            disabled={room.status === "archived"}
            onClick={() => setAction({ kind: "archive", room })}
          >
            <IconArchive aria-hidden />
          </Button>
        </>
      )),
    ],
    [t],
  )

  return (
    <PageContainer title={t("title")}>
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(room) => room.id}
        emptyText={t("empty")}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          />
        }
      />
      <RoomDialogs action={action} rooms={rooms.data ?? []} onClose={() => setAction(null)} />
    </PageContainer>
  )
}
