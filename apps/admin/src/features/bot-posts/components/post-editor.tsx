"use client"

import {
  isApiError,
  BOT_POST_LIMITS,
  type BotPostAudience,
  type BotPostButton,
  type BotPostLocalized,
  type BotPostTreeNode,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmDialog,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { useCreateBotPost, useDeleteBotPost, useMoveBotPost, useSaveBotPost } from "../hooks/use-bot-posts"
import { botPostErrorMessage } from "../utils/errors"
import { LOCALE_CODES, localized, type BotLocale } from "../utils/locales"
import { canDeleteBotPost, moveTargets } from "../utils/tree"
import { BodyEditor } from "./body-editor"
import { ButtonsEditor } from "./buttons-editor"
import { TelegramPreview } from "./telegram-preview"

const AUDIENCES: BotPostAudience[] = ["guest", "student", "both"]

type Texts = { uz: string; ru: string; en: string }

type Form = {
  slug: string
  title: Texts
  body: Texts
  audience: BotPostAudience
  published: boolean
  buttons: BotPostButton[]
}

function texts(value: BotPostLocalized | undefined): Texts {
  return { uz: localized(value, "uz"), ru: localized(value, "ru"), en: localized(value, "en") }
}

function toForm(post: BotPostTreeNode): Form {
  return {
    slug: post.slug,
    title: texts(post.title),
    body: texts(post.body),
    audience: post.audience,
    published: post.published,
    buttons: post.buttons.map((button) => ({ label: texts(button.label), url: button.url })),
  }
}

/** Shows the mapped message of a failed request, or nothing. */
function ErrorLine({ error }: { error: unknown }) {
  const t = useT("botPosts")
  if (!error) return null
  const message = botPostErrorMessage(error)
  return (
    <Alert variant="destructive">
      <AlertDescription>{t(message.key, message.values)}</AlertDescription>
    </Alert>
  )
}

/**
 * Editor of one post. Mounted with `key={post.id}`, so the form starts from the saved post every time.
 * The root has no delete or move action.
 */
export function PostEditor({
  post,
  root,
  onSelect,
}: {
  post: BotPostTreeNode
  root: BotPostTreeNode
  onSelect: (id: string) => void
}) {
  const t = useT("botPosts")
  const [form, setForm] = useState<Form>(() => toForm(post))
  const [locale, setLocale] = useState<BotLocale>("ru")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cascadeOffer, setCascadeOffer] = useState(false)
  const save = useSaveBotPost()
  const create = useCreateBotPost()
  const remove = useDeleteBotPost()
  const move = useMoveBotPost()
  const targets = moveTargets(root, post).filter((target) => target.id !== post.parent_id)
  const busy = save.isPending || create.isPending || remove.isPending || move.isPending
  const failure = save.error ?? create.error ?? move.error ?? remove.error

  function setTitle(code: BotLocale, value: string) {
    setForm((current) => ({ ...current, title: { ...current.title, [code]: value } }))
  }

  function setBody(code: BotLocale, html: string) {
    setForm((current) => ({ ...current, body: { ...current.body, [code]: html } }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate({
      id: post.id,
      body: {
        slug: form.slug,
        title: form.title,
        body: form.body,
        audience: form.audience,
        published: form.published,
        buttons: form.buttons,
      },
    })
  }

  function addChild() {
    create.mutate(
      {
        parent_id: post.id,
        slug: `post-${Date.now().toString(36)}`,
        title: { uz: "", ru: "", en: "" },
        audience: "both",
        published: false,
        buttons: [],
      },
      { onSuccess: (created) => onSelect(created.id) },
    )
  }

  function deletePost() {
    remove.mutate(
      { id: post.id, cascade: cascadeOffer },
      {
        onSuccess: () => {
          setConfirmDelete(false)
          setCascadeOffer(false)
          onSelect(post.parent_id ?? post.id)
        },
        onError: (error) => {
          // The post has children: offer to delete the whole branch instead.
          if (isApiError(error) && error.type === "posts/has-children") setCascadeOffer(true)
        },
      },
    )
  }

  const buttonPreview = form.buttons.map((button) => ({ label: localized(button.label, locale), url: button.url }))

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <ErrorLine error={failure} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="bot-post-slug">{t("editor.slug")}</Label>
        <Input
          id="bot-post-slug"
          value={form.slug}
          maxLength={64}
          disabled={busy}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
        />
      </div>

      <Tabs value={locale} onValueChange={(value) => setLocale(value as BotLocale)}>
        <TabsList aria-label={t("editor.locale")}>
          {LOCALE_CODES.map((code) => (
            <TabsTrigger key={code} value={code}>
              {code.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
        {LOCALE_CODES.map((code) => (
          <TabsContent key={code} value={code} className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`bot-post-title-${code}`}>{t("editor.title")}</Label>
              <Input
                id={`bot-post-title-${code}`}
                value={form.title[code]}
                maxLength={BOT_POST_LIMITS.title}
                disabled={busy}
                onChange={(event) => setTitle(code, event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`bot-post-body-${code}`}>{t("editor.body")}</Label>
              <BodyEditor
                id={`bot-post-body-${code}`}
                value={form.body[code]}
                onChange={(html) => setBody(code, html)}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("preview.title")}</p>
        <TelegramPreview html={form.body[locale]} buttons={buttonPreview} />
      </div>

      <ButtonsEditor
        idPrefix="bot-post-button"
        value={form.buttons}
        onChange={(buttons) => setForm((current) => ({ ...current, buttons }))}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="bot-post-audience">{t("editor.audience")}</Label>
        <select
          id="bot-post-audience"
          className="border-input bg-background h-10 rounded-md border px-3 text-sm"
          value={form.audience}
          disabled={busy}
          onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as BotPostAudience }))}
        >
          {AUDIENCES.map((audience) => (
            <option key={audience} value={audience}>
              {t(`audience.${audience}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="bot-post-published"
          checked={form.published}
          disabled={busy}
          onCheckedChange={(checked) => setForm((current) => ({ ...current, published: checked }))}
        />
        <Label htmlFor="bot-post-published">{t("editor.published")}</Label>
      </div>

      {canDeleteBotPost(post) ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bot-post-parent">{t("editor.parent")}</Label>
          <select
            id="bot-post-parent"
            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            value=""
            disabled={busy || targets.length === 0}
            onChange={(event) => move.mutate({ id: post.id, parentId: event.target.value })}
          >
            <option value="" disabled>
              {t("editor.moveTo")}
            </option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {localized(target.title, locale) || target.slug}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>
          {t("editor.save")}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={addChild}>
          {t("editor.addChild")}
        </Button>
        {canDeleteBotPost(post) ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              setCascadeOffer(false)
              setConfirmDelete(true)
            }}
          >
            {t("editor.delete")}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={cascadeOffer ? t("deleteWithChildrenTitle") : t("deleteTitle")}
        description={cascadeOffer ? t("deleteWithChildrenDescription") : t("deleteDescription")}
        confirmLabel={cascadeOffer ? t("editor.deleteWithChildren") : t("editor.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={deletePost}
      />
    </form>
  )
}
