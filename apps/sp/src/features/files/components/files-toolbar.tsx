"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconCloud,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUpload,
  Input,
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative order-first w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 sm:basis-56">
        <IconSearch aria-hidden className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={search}
          aria-label={tDrive("search")}
          placeholder={tDrive("search")}
          className="h-11 rounded-full pl-9 md:h-9"
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant={typeOption === "all" ? "outline" : "secondary"}
              size="icon"
              className="size-11 rounded-full md:size-9"
              aria-label={t("filter")}
              title={t("filter")}
            />
          }
        >
          <IconFilter aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("fileType")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={typeOption} onValueChange={(value) => onTypeOption(value as FileTypeOption)}>
              {FILE_TYPE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {t(`types.${option.id}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>
  )
}
