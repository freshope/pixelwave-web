"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { boards, posts } from "@/db/schema";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parsePostForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "");
  const isPublished = formData.get("is_published") != null;

  if (!SLUG_RE.test(slug)) {
    throw new Error("slug 는 영문 소문자/숫자/하이픈만 (예: my-post)");
  }
  if (!title) throw new Error("title 필수");

  return { slug, title, bodyMd, isPublished };
}

async function getBoardIdBySlugOr404(boardSlug: string): Promise<number> {
  const rows = await getDb()
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.slug, boardSlug))
    .limit(1);
  if (rows.length === 0) notFound();
  return rows[0]!.id;
}

export async function listBoardPosts(boardSlug: string) {
  const db = getDb();
  const boardId = await getBoardIdBySlugOr404(boardSlug);
  return db
    .select()
    .from(posts)
    .where(eq(posts.boardId, boardId))
    .orderBy(desc(posts.updatedAt));
}

export async function getPostBySlug(boardSlug: string, postSlug: string) {
  const db = getDb();
  const boardId = await getBoardIdBySlugOr404(boardSlug);
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.boardId, boardId), eq(posts.slug, postSlug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPost(boardSlug: string, formData: FormData) {
  const { slug, title, bodyMd, isPublished } = parsePostForm(formData);
  const boardId = await getBoardIdBySlugOr404(boardSlug);

  await getDb()
    .insert(posts)
    .values({
      boardId,
      slug,
      title,
      bodyMd,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    });

  revalidatePath(`/admin/boards/${boardSlug}/posts`);
  redirect(`/admin/boards/${boardSlug}/posts/${slug}`);
}

export async function updatePost(
  boardSlug: string,
  postId: number,
  formData: FormData,
) {
  const { slug, title, bodyMd, isPublished } = parsePostForm(formData);

  await getDb()
    .update(posts)
    .set({
      slug,
      title,
      bodyMd,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  revalidatePath(`/admin/boards/${boardSlug}/posts`);
  revalidatePath(`/admin/boards/${boardSlug}/posts/${slug}`);
  redirect(`/admin/boards/${boardSlug}/posts/${slug}`);
}

export async function deletePost(boardSlug: string, postId: number) {
  await getDb().delete(posts).where(eq(posts.id, postId));
  revalidatePath(`/admin/boards/${boardSlug}/posts`);
  redirect(`/admin/boards/${boardSlug}/posts`);
}
