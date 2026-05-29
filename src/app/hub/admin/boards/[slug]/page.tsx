import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteBoard,
  getBoardBySlug,
  listSiteSlugs,
  updateBoard,
} from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} — Admin` };
}

export default async function BoardEditPage({ params }: Props) {
  const { slug } = await params;
  const [board, siteSlugs] = await Promise.all([
    getBoardBySlug(slug),
    listSiteSlugs(),
  ]);
  if (!board) notFound();

  const exposureSet = new Set(board.exposureSites);
  const boardId = board.id;

  return (
    <main className="wrap">
      <h1>보드 편집 · {board.slug}</h1>
      <p className="updated">
        <Link href="/admin/boards">← 보드 목록</Link>
      </p>

      <form action={updateBoard.bind(null, boardId)}>
        <p>
          <label>
            slug<br />
            <input
              name="slug"
              defaultValue={board.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
        </p>
        <p>
          <label>
            title<br />
            <input name="title" defaultValue={board.title} required />
          </label>
        </p>
        <p>
          <label>
            owner_site<br />
            <select name="owner_site" defaultValue={board.ownerSite} required>
              {siteSlugs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </p>
        <p>
          노출 허용 사이트:
          <br />
          {siteSlugs.map((s) => (
            <label key={s} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                name="exposure_sites"
                value={s}
                defaultChecked={exposureSet.has(s)}
              />{" "}
              {s}
            </label>
          ))}
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={board.isPublic}
            />{" "}
            공개
          </label>
        </p>
        <p>
          <button type="submit">저장</button>
        </p>
      </form>

      <hr />

      <form action={deleteBoard.bind(null, boardId)}>
        <button type="submit">보드 삭제</button>
      </form>
    </main>
  );
}
