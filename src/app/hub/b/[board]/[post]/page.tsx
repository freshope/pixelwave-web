import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { boards, posts } from "@/db/schema";
import { mdToSafeHtml } from "@/lib/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ board: string; post: string }> };

async function loadPost(boardSlug: string, postSlug: string) {
  const db = getDb();
  const rows = await db
    .select({
      boardSlug: boards.slug,
      boardTitle: boards.title,
      boardIsPublic: boards.isPublic,
      post: posts,
    })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(and(eq(boards.slug, boardSlug), eq(posts.slug, postSlug)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.boardIsPublic || row.post.publishedAt === null) {
    return null;
  }
  return row;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board, post } = await params;
  const row = await loadPost(board, post);
  if (!row) return { title: "Not Found" };
  return {
    title: `${row.post.title} — Pixelwave`,
    alternates: { canonical: `https://pixelwave.app/b/${board}/${post}` },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { board, post } = await params;
  const row = await loadPost(board, post);
  if (!row) notFound();

  const html = await mdToSafeHtml(row.post.bodyMd);

  return (
    <main className="wrap">
      <p className="updated">
        <Link href={`/b/${board}`}>← {row.boardTitle}</Link>
      </p>
      <h1>{row.post.title}</h1>
      <p className="updated">{row.post.publishedAt!.toISOString().slice(0, 10)}</p>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
