import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { boards, boardSites, posts } from "@/db/schema";

export type SiteSlug = "hub" | "invest-note" | "today-alive";

/**
 * 해당 site 에 노출이 허용된 boards 1행을 조회한다.
 * - boards + board_sites 의 inner join 으로 화이트리스트 동시 검사.
 * - board.isPublic = false 면 null.
 */
export async function loadBoardForSite(boardSlug: string, siteSlug: SiteSlug) {
  const db = getDb();
  const rows = await db
    .select({ board: boards })
    .from(boards)
    .innerJoin(
      boardSites,
      and(
        eq(boardSites.boardId, boards.id),
        eq(boardSites.siteSlug, siteSlug),
      ),
    )
    .where(eq(boards.slug, boardSlug))
    .limit(1);
  const board = rows[0]?.board;
  if (!board || !board.isPublic) return null;
  return board;
}

export async function loadPostForSite(
  boardSlug: string,
  postSlug: string,
  siteSlug: SiteSlug,
) {
  const db = getDb();
  const rows = await db
    .select({ board: boards, post: posts })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .innerJoin(
      boardSites,
      and(
        eq(boardSites.boardId, boards.id),
        eq(boardSites.siteSlug, siteSlug),
      ),
    )
    .where(and(eq(boards.slug, boardSlug), eq(posts.slug, postSlug)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.board.isPublic || row.post.publishedAt === null) return null;
  return row;
}

export async function listPublishedPostsForSite(
  boardSlug: string,
  siteSlug: SiteSlug,
) {
  const board = await loadBoardForSite(boardSlug, siteSlug);
  if (!board) return null;
  const list = await getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.boardId, board.id), isNotNull(posts.publishedAt)))
    .orderBy(desc(posts.publishedAt));
  return { board, posts: list };
}

/** 정본 hub URL — site 별 페이지의 canonical 메타에 사용. */
export function canonicalForPost(boardSlug: string, postSlug: string) {
  return `https://pixelwave.app/b/${boardSlug}/${postSlug}`;
}

export function canonicalForBoard(boardSlug: string) {
  return `https://pixelwave.app/b/${boardSlug}`;
}
