"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconChevronDown,
  IconCloud,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconSettings,
  IconUpload,
  ListToolbar,
} from "@ihsp/ui"
import { FILE_TYPE_OPTIONS, type FileTypeOption, type FileView } from "../utils/file-filters"

type FilesToolbarProps = {
  search: string
  onSearch: (value: string) => void
  typeOption: FileTypeOption
  onTypeOption: (value: FileTypeOption) => void
  view: FileView
  onView: (view: FileView) => void
  onUpload: () => void
  onStorage: () => void
}

/**
 * Search, file-type filter, grid or list toggle, the New menu (upload) and the settings menu (storage). A phone
 * puts the search on its own line; there is no folder or trash action because the API has neither.
 */
export function FilesToolbar({
  search,
  onSearch,
  typeOption,
  onTypeOption,
  view,
  onView,
  onUpload,
  onStorage,
}: FilesToolbarProps) {
  const t = useT("files.page")
  const tDrive = useT("files.drive")

  return (
    <ListToolbar
      filters={[
        { kind: "search", key: "q", label: tDrive("search"), debounceMs: 0 },
        {
          kind: "select",
          key: "type",
          label: t("fileType"),
          allLabel: t("types.all"),
          options: FILE_TYPE_OPTIONS.filter((option) => option.id !== "all").map((option) => ({
            value: option.id,
            label: t(`types.${option.id}`),
          })),
        },
      ]}
      values={{ q: search, type: typeOption === "all" ? null : typeOption }}
      onChange={(key, next) => {
        if (key === "q") onSearch(next ?? "")
        else onTypeOption((next ?? "all") as FileTypeOption)
      }}
      onReset={() => {
        onSearch("")
        onTypeOption("all")
      }}
    >
      <div className="flex gap-1" role="group" aria-label={tDrive("view")}>
        <Button
          type="button"
          variant={view === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="size-11 rounded-full md:size-9"
          aria-label={tDrive("grid")}
          aria-pressed={view === "grid"}
          onClick={() => onView("grid")}
        >
          <IconLayoutGrid aria-hidden />
        </Button>
        <Button
          type="button"
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon"
          className="size-11 rounded-full md:size-9"
          aria-label={tDrive("list")}
          aria-pressed={view === "list"}
          onClick={() => onView("list")}
        >
          <IconList aria-hidden />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" className="min-h-11 rounded-full px-4 md:min-h-9" />}>
          <IconPlus aria-hidden />
          {t("new")}
          <IconChevronDown aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onUpload}>
            <IconUpload aria-hidden />
            {t("upload")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-full md:size-9"
              aria-label={t("settings")}
              title={t("settings")}
            />
          }
        >
          <IconSettings aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("manage")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={onStorage}>
              <IconCloud aria-hidden />
              {t("storage")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ListToolbar>
  )
}
