import type { BotPost, BotPostTreeNode } from "@ihsp/api"
import { uuid } from "./world"

const ROOT_ID = uuid(103, 1)
const WELCOME_ID = uuid(103, 2)
const SCHEDULE_ID = uuid(103, 3)
const HELP_ID = uuid(103, 4)

/** The bot post tree: a root with three children, the last of which has one child. */
export const botPostList: BotPost[] = [
  {
    id: ROOT_ID,
    parent_id: null,
    slug: "root",
    title: { uz: "Bosh menyu", ru: "Главное меню", en: "Main menu" },
    body: {},
    audience: "both",
    sort_order: 0,
    published: true,
    is_root: true,
    buttons: [],
  },
  {
    id: WELCOME_ID,
    parent_id: ROOT_ID,
    slug: "welcome",
    title: { uz: "Xush kelibsiz", ru: "Добро пожаловать", en: "Welcome" },
    body: { en: "<b>Welcome</b> to the lyceum bot." },
    audience: "guest",
    sort_order: 0,
    published: true,
    is_root: false,
    buttons: [{ label: { en: "Site" }, url: "https://example.org" }],
  },
  {
    id: SCHEDULE_ID,
    parent_id: ROOT_ID,
    slug: "schedule",
    title: { uz: "Dars jadvali", ru: "Расписание", en: "Schedule" },
    body: { en: "Your timetable." },
    audience: "student",
    sort_order: 1,
    published: true,
    is_root: false,
    buttons: [],
  },
  {
    id: HELP_ID,
    parent_id: ROOT_ID,
    slug: "help",
    title: { uz: "Yordam", ru: "Помощь", en: "Help" },
    body: {},
    audience: "both",
    sort_order: 2,
    published: false,
    is_root: false,
    buttons: [],
  },
]

function buildTree(posts: BotPost[], parentId: string | null): BotPostTreeNode[] {
  return posts
    .filter((post) => post.parent_id === parentId)
    .toSorted((a, b) => a.sort_order - b.sort_order)
    .map((post) => ({ ...post, children: buildTree(posts, post.id) }))
}

/** `GET /v1/admin/posts/tree`: the whole tree from the root. */
export const botPostTree: BotPostTreeNode = {
  ...botPostList[0]!,
  children: buildTree(botPostList, ROOT_ID),
}
