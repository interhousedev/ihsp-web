"use client"

import type { FileItem, LessonItem } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Icons,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { useAddResource } from "../hooks/use-lesson-mutations"
import { useSameSubjectLessons } from "../hooks/use-same-subject-lessons"

type Role = "material" | "attachment"

function isRole(value: unknown): value is Role {
  return value === "material" || value === "attachment"
}

/**
 * "Add material" (STF-5, UF-STF-04): a file (uploaded straight to storage) or a link, as a Material (default) or an
 * Attachment, and optionally for other lessons of the same subject too ("Also add to").
 */
export function AddMaterialDialog({
  lesson,
  defaultOpen = false,
  onClose,
}: {
  lesson: LessonItem
  defaultOpen?: boolean
  onClose?: () => void
}) {
  const t = useT("lesson.add")
  const f = useFormatters()
  const audienceLabel = useAudienceLabel()
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(defaultOpen)
  const [role, setRole] = useState<Role>("material")
  const [url, setUrl] = useState("")
  const [also, setAlso] = useState<string[]>([])
  const add = useAddResource(lesson.id)
  const others = useSameSubjectLessons(lesson, open)

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) {
      setUrl("")
      setAlso([])
      add.reset()
      onClose?.()
    }
  }

  function submit(source: { kind: "file"; file_id: string } | { kind: "url"; target_url: string }) {
    add.mutate(
      { role, ...source, ...(also.length > 0 ? { also_lesson_ids: also } : {}) },
      {
        onSuccess: () => {
          toast.success(t("added"))
          changeOpen(false)
        },
      },
    )
  }

  function toggleAlso(id: string, checked: boolean) {
    setAlso((current) => (checked ? [...current, id] : current.filter((value) => value !== id)))
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button className="min-h-11 md:min-h-8" />}>
        <Icons.add aria-hidden />
        {t("button")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <span id="add-role" className="text-sm font-medium">
            {t("kind")}
          </span>
          <ToggleGroup
            value={[role]}
            variant="outline"
            aria-labelledby="add-role"
            onValueChange={(values) => {
              const next = values[0]
              if (isRole(next)) setRole(next)
            }}
          >
            <ToggleGroupItem value="material" className="min-h-11 px-3 md:min-h-8">
              {t("role.material")}
            </ToggleGroupItem>
            <ToggleGroupItem value="attachment" className="min-h-11 px-3 md:min-h-8">
              {t("role.attachment")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {others.lessons.length > 0 ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-sm font-medium">{t("alsoAdd")}</legend>
            {others.lessons.map((other) => (
              <label key={other.id} className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
                <Checkbox
                  checked={also.includes(other.id)}
                  onCheckedChange={(checked) => toggleAlso(other.id, checked === true)}
                />
                <span>
                  {f.date(other.date, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                  {t("period", { number: other.period })} · {audienceLabel(other.audience)}
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        <Tabs defaultValue="file">
          <TabsList className="h-auto min-h-11 w-full">
            <TabsTrigger value="file" className="min-h-11">
              {t("tabs.file")}
            </TabsTrigger>
            <TabsTrigger value="link" className="min-h-11">
              {t("tabs.link")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="flex flex-col gap-3 pt-3">
            <FileUploadButton
              purpose="link"
              label={t("upload")}
              onUploaded={(file: FileItem) => submit({ kind: "file", file_id: file.id })}
            />
          </TabsContent>
          <TabsContent value="link" className="pt-3">
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (url.trim() !== "") submit({ kind: "url", target_url: url.trim() })
              }}
            >
              <Input
                type="url"
                inputMode="url"
                required
                value={url}
                placeholder="https://"
                aria-label={t("url")}
                className="h-11 md:h-8"
                onChange={(event) => setUrl(event.target.value)}
              />
              <Button type="submit" className="min-h-11 md:min-h-8" disabled={add.isPending || url.trim() === ""}>
                {t("addLink")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        {add.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(add.error)}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
