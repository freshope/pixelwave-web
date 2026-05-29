import Link from "next/link";
import { listBoardsWithExposure } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "보드 목록 — Admin",
};

export default async function BoardsListPage() {
  const list = await listBoardsWithExposure();

  return (
    <main className="wrap">
      <h1>보드</h1>
      <p className="updated">
        <Link href="/admin/boards/new">+ 새 보드</Link> &nbsp;|&nbsp;{" "}
        <Link href="/admin">← Admin</Link>
      </p>

      {list.length === 0 ? (
        <p>아직 보드가 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>slug</th>
              <th>title</th>
              <th>owner</th>
              <th>노출</th>
              <th>공개</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={`/admin/boards/${b.slug}`}>{b.slug}</Link>
                </td>
                <td>{b.title}</td>
                <td>{b.ownerSite}</td>
                <td>{b.exposureSites.join(", ")}</td>
                <td>{b.isPublic ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
