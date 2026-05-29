import { signIn } from "@/auth";

export const metadata = {
  title: "관리자 로그인 — Pixelwave",
};

export default function LoginPage() {
  return (
    <main className="wrap">
      <h1>관리자 로그인</h1>
      <p className="updated">화이트리스트에 등록된 GitHub 계정만 진입 가능합니다.</p>
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/admin" });
        }}
      >
        <button type="submit" className="store-badges">
          GitHub 으로 로그인
        </button>
      </form>
    </main>
  );
}
