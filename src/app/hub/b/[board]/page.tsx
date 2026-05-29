import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { boards, posts } from "@/db/schema";

export const revalidate = 60;

type Props = { params: Promise<{ board: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params;
  const rows = await getDb()
    .select({ title: boards.title })
    .from(boards)
    .where(eq(boards.slug, board))
    .limit(1);
  if (rows.length === 0) return { title: "Not Found" };
  return {
    title: `${rows[0]!.title} — Pixelwave`,
    alternates: { canonical: `https://pixelwave.app/b/${board}` },
  };
}

export default async function BoardListPage({ params }: Props) {
  const { board } = await params;
  const db = getDb();

  const boardRows = await db
    .select()
    .from(boards)
    .where(eq(boards.slug, board))
    .limit(1);
  if (boardRows.length === 0) notFound();
  const b = boardRows[0]!;
  if (!b.isPublic) notFound();

  const list = await db
    .select()
    .from(posts)
    .where(and(eq(posts.boardId, b.id), isNotNull(posts.publishedAt)))
    .orderBy(desc(posts.publishedAt));

  return (
    <main className="wrap">
      <h1>{b.title}</h1>
      {list.length === 0 ? (
        <p>아직 글이 없습니다.</p>
      ) : (
        <ul>
          {list.map((p) => (
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
