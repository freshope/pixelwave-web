import Link from "next/link";
import { createPost } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `새 글 (${slug}) — Admin` };
}

export default async function NewPostPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="wrap">
      <h1>{slug} · 새 글</h1>
      <p className="updated">
        <Link href={`/admin/boards/${slug}/posts`}>← 글 목록</Link>
      </p>

      <form action={createPost.bind(null, slug)}>
        <p>
          <label>
            slug<br />
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="예: hello-world"
            />
          </label>
        </p>
        <p>
          <label>
            title<br />
            <input name="title" required />
          </label>
        </p>
        <p>
          <label>
            body (markdown)<br />
            <textarea
              name="body_md"
              rows={20}
              style={{ width: "100%", fontFamily: "monospace" }}
            />
          </label>
        </p>
        <p>
          <label>
            <input type="checkbox" name="is_published" /> 즉시 공개
          </label>
        </p>
        <p>
          <button type="submit">작성</button>
        </p>
      </form>
    </main>
  );
}
