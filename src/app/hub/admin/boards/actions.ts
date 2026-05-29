"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { boards, boardSites, sites } from "@/db/schema";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseExposureSites(formData: FormData): string[] {
  // 체크박스 그룹 name="exposure_sites" 의 모든 선택값.
  return formData.getAll("exposure_sites").map(String).filter(Boolean);
}

async function validSiteSlugs(): Promise<Set<string>> {
  const rows = await getDb().select({ slug: sites.slug }).from(sites);
  return new Set(rows.map((r) => r.slug));
}

function parseBoardForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const ownerSite = String(formData.get("owner_site") ?? "").trim();
  const isPublic = formData.get("is_public") != null;
  const exposureSites = parseExposureSites(formData);

  if (!SLUG_RE.test(slug)) {
    throw new Error("slug 는 영문 소문자/숫자/하이픈만 (예: my-board)");
  }
  if (!title) throw new Error("title 필수");
  if (!ownerSite) throw new Error("owner_site 필수");

  return { slug, title, ownerSite, isPublic, exposureSites };
}

export async function createBoard(formData: FormData) {
  const { slug, title, ownerSite, isPublic, exposureSites } =
    parseBoardForm(formData);

  const validSites = await validSiteSlugs();
  if (!validSites.has(ownerSite)) throw new Error("invalid owner_site");
  const exposure = new Set<string>([
    ownerSite,
    ...exposureSites.filter((s) => validSites.has(s)),
  ]);

  const db = getDb();
  const inserted = await db
    .insert(boards)
    .values({ slug, title, ownerSite, isPublic })
    .returning({ id: boards.id });

  const boardId = inserted[0]!.id;
  await db.insert(boardSites).values(
    [...exposure].map((siteSlug) => ({ boardId, siteSlug })),
  );

  revalidatePath("/admin/boards");
  redirect(`/admin/boards/${slug}`);
}

export async function updateBoard(boardId: number, formData: FormData) {
  const { slug, title, ownerSite, isPublic, exposureSites } =
    parseBoardForm(formData);

  const validSites = await validSiteSlugs();
  if (!validSites.has(ownerSite)) throw new Error("invalid owner_site");
  const exposure = new Set<string>([
    ownerSite,
    ...exposureSites.filter((s) => validSites.has(s)),
  ]);

  const db = getDb();
  await db
    .update(boards)
    .set({ slug, title, ownerSite, isPublic })
    .where(eq(boards.id, boardId));

  // board_sites 재구성: 기존 행 삭제 후 다시 삽입 (작은 테이블이라 단순).
  await db.delete(boardSites).where(eq(boardSites.boardId, boardId));
  await db.insert(boardSites).values(
    [...exposure].map((siteSlug) => ({ boardId, siteSlug })),
  );

  revalidatePath("/admin/boards");
  revalidatePath(`/admin/boards/${slug}`);
  redirect(`/admin/boards/${slug}`);
}

export async function deleteBoard(boardId: number) {
  const db = getDb();
  // posts/board_sites 는 FK cascade.
  await db.delete(boards).where(eq(boards.id, boardId));
  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

export async function listBoardsWithExposure() {
  const db = getDb();
  const rows = await db.select().from(boards).orderBy(boards.createdAt);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const exposureRows = await db
    .select()
    .from(boardSites)
    .where(inArray(boardSites.boardId, ids));
  const byBoard = new Map<number, string[]>();
  for (const r of exposureRows) {
    const list = byBoard.get(r.boardId) ?? [];
    list.push(r.siteSlug);
    byBoard.set(r.boardId, list);
  }
  return rows.map((b) => ({
    ...b,
    exposureSites: (byBoard.get(b.id) ?? []).sort(),
  }));
}

export async function getBoardBySlug(slug: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(boards)
    .where(eq(boards.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const board = rows[0]!;
  const exposure = await db
    .select({ siteSlug: boardSites.siteSlug })
    .from(boardSites)
    .where(eq(boardSites.boardId, board.id));
  return {
    ...board,
    exposureSites: exposure.map((e) => e.siteSlug).sort(),
  };
}

export async function listSiteSlugs() {
  const rows = await getDb()
    .select({ slug: sites.slug })
    .from(sites)
    .orderBy(sites.slug);
  return rows.map((r) => r.slug);
}
