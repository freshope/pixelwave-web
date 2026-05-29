import Link from "next/link";
import { auth, signOut } from "@/auth";

export const metadata = {
  title: "Admin — Pixelwave",
};

export default async function AdminPage() {
  const session = await auth();
  return (
    <main className="wrap">
      <h1>Admin</h1>
      <p>
        로그인: {session?.user?.name ?? "(unknown)"} (github id{" "}
        {session?.user?.githubId ?? "-"})
      </p>
      <ul>
        <li>
          <Link href="/admin/boards">보드 관리</Link>
        </li>
      </ul>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit">로그아웃</button>
      </form>
    </main>
  );
}
