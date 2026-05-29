import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  canonicalForBoard,
  listPublishedPostsForSite,
} from "@/lib/board-post";

export const revalidate = 60;

type Props = { params: Promise<{ board: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params;
  const r = await listPublishedPostsForSite(board, "invest-note");
  if (!r) return { title: "Not Found" };
  return {
    title: `${r.board.title} — 투자노트`,
    alternates: { canonical: canonicalForBoard(board) },
  };
}

export default async function InvestNoteBoardListPage({ params }: Props) {
  const { board } = await params;
  const r = await listPublishedPostsForSite(board, "invest-note");
  if (!r) notFound();

  return (
    <main className="wrap">
      <h1>{r.board.title}</h1>
      {r.posts.length === 0 ? (
        <p>아직 글이 없습니다.</p>
      ) : (
        <ul>
          {r.posts.map((p) => (
            <li key={p.id}>
              <Link href={`/b/${board}/${p.slug}`}>{p.title}</Link>
              <span style={{ color: "var(--color-fg-muted)" }}>
                {" "}
                · {p.publishedAt!.toISOString().slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
