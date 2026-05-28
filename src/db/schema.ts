import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 사이트 (host 분기 대상). slug 자체가 PK 라 FK 참조가 직관적이다.
export const sites = pgTable("sites", {
  slug: text("slug").primaryKey(),
});

// 보드. owner_site 가 정본이 노출되는 사이트.
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  ownerSite: text("owner_site")
    .notNull()
    .references(() => sites.slug, { onDelete: "restrict" }),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 보드 ↔ 사이트 M:N. owner_site 외 추가로 노출 허용된 사이트.
export const boardSites = pgTable(
  "board_sites",
  {
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    siteSlug: text("site_slug")
      .notNull()
      .references(() => sites.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.boardId, t.siteSlug] })],
);

// 글. (board_id, slug) 유니크 — 보드 안에서 슬러그 충돌 방지.
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    bodyMd: text("body_md").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("posts_board_slug_uniq").on(t.boardId, t.slug)],
);

// 사용자. v1 은 admin 만. github_id 는 OAuth profile.id (숫자).
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: integer("github_id").notNull().unique(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
