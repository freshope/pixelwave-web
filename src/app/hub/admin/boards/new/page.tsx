import Link from "next/link";
import { createBoard, listSiteSlugs } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "새 보드 — Admin",
};

export default async function NewBoardPage() {
  const siteSlugs = await listSiteSlugs();

  return (
    <main className="wrap">
      <h1>새 보드</h1>
      <p className="updated">
        <Link href="/admin/boards">← 보드 목록</Link>
      </p>

      <form action={createBoard}>
        <p>
          <label>
            slug<br />
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="예: tech-notes"
            />
          </label>
        </p>
        <p>
          <label>
            title<br />
            <input name="title" required placeholder="예: 기술 노트" />
          </label>
        </p>
        <p>
          <label>
            owner_site<br />
            <select name="owner_site" defaultValue="hub" required>
              {siteSlugs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </p>
        <p>
          노출 허용 사이트 (owner 는 자동 포함):
          <br />
          {siteSlugs.map((s) => (
            <label key={s} style={{ marginRight: 12 }}>
              <input type="checkbox" name="exposure_sites" value={s} /> {s}
            </label>
          ))}
        </p>
        <p>
          <label>
            <input type="checkbox" name="is_public" defaultChecked /> 공개
          </label>
        </p>
        <p>
          <button type="submit">생성</button>
        </p>
      </form>
    </main>
  );
}
