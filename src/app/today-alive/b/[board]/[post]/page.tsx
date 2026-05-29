import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { canonicalForPost, loadPostForSite } from "@/lib/board-post";
import { mdToSafeHtml } from "@/lib/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ board: string; post: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board, post } = await params;
  const row = await loadPostForSite(board, post, "today-alive");
  if (!row) return { title: "Not Found" };
  return {
    title: `${row.post.title} — 오늘 하루`,
    alternates: { canonical: canonicalForPost(board, post) },
  };
}

export default async function TodayAlivePostDetailPage({ params }: Props) {
  const { board, post } = await params;
  const row = await loadPostForSite(board, post, "today-alive");
  if (!row) notFound();

  const html = await mdToSafeHtml(row.post.bodyMd);

  return (
    <main className="wrap">
      <p className="updated">
        <Link href={`/b/${board}`}>← {row.board.title}</Link>
      </p>
      <h1>{row.post.title}</h1>
      <p className="updated">{row.post.publishedAt!.toISOString().slice(0, 10)}</p>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
