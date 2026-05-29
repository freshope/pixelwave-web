import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost, getPostBySlug, updatePost } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; postSlug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug, postSlug } = await params;
  return { title: `${postSlug} (${slug}) — Admin` };
}

export default async function PostEditPage({ params }: Props) {
  const { slug, postSlug } = await params;
  const post = await getPostBySlug(slug, postSlug);
  if (!post) notFound();

  const postId = post.id;
  const isPublished = post.publishedAt !== null;

  return (
    <main className="wrap">
      <h1>{slug} · 글 편집 · {post.slug}</h1>
      <p className="updated">
        <Link href={`/admin/boards/${slug}/posts`}>← 글 목록</Link>
      </p>

      <form action={updatePost.bind(null, slug, postId)}>
        <p>
          <label>
            slug<br />
            <input
              name="slug"
              defaultValue={post.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
        </p>
        <p>
          <label>
            title<br />
            <input name="title" defaultValue={post.title} required />
          </label>
        </p>
        <p>
          <label>
            body (markdown)<br />
            <textarea
              name="body_md"
              defaultValue={post.bodyMd}
              rows={20}
              style={{ width: "100%", fontFamily: "monospace" }}
            />
          </label>
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={isPublished}
            />{" "}
            공개
            {post.publishedAt && (
              <span style={{ color: "var(--color-fg-muted)" }}>
                {" "}
                (현재 publishedAt: {post.publishedAt.toISOString().slice(0, 19)})
              </span>
            )}
          </label>
        </p>
        <p>
          <button type="submit">저장</button>
        </p>
      </form>

      <hr />

      <form action={deletePost.bind(null, slug, postId)}>
        <button type="submit">글 삭제</button>
      </form>
    </main>
  );
}
