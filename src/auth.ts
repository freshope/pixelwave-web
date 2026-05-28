import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

function parseAdminIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // v1: ADMIN_GITHUB_IDS 화이트리스트만 통과. 그 외는 거부.
      const allowed = parseAdminIds(process.env.ADMIN_GITHUB_IDS);
      if (!profile?.id) return false;
      return allowed.includes(String(profile.id));
    },
    async jwt({ token, profile }) {
      if (profile?.id !== undefined) {
        token.githubId = String(profile.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.githubId) {
        session.user.githubId = token.githubId as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
