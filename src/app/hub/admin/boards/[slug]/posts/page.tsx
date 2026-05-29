import Link from "next/link";
import { listBoardPosts } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} 글 — Admin` };
}

export default async function BoardPostsListPage({ params }: Props) {
  const { slug } = await params;
  const list = await listBoardPosts(slug);

  return (
    <main className="wrap">
      <h1>{slug} · 글</h1>
      <p className="updated">
        <Link href={`/admin/boards/${slug}/posts/new`}>+ 새 글</Link> &nbsp;|&nbsp;{" "}
        <Link href={`/admin/boards/${slug}`}>← 보드 편집</Link>
      </p>

      {list.length === 0 ? (
        <p>아직 글이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>slug</th>
              <th>title</th>
              <th>updated_at</th>
              <th>공개</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/boards/${slug}/posts/${p.slug}`}>
                    {p.slug}
                  </Link>
                </td>
                <td>{p.title}</td>
                <td>{p.updatedAt.toISOString().slice(0, 19)}</td>
                <td>{p.publishedAt ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
