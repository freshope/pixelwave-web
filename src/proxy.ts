import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITES = ["hub", "invest-note", "today-alive"] as const;
type Site = (typeof SITES)[number];

const SITE_BY_HOST: Record<string, Site> = {
  "pixelwave.app": "hub",
  "www.pixelwave.app": "hub",
  "next.pixelwave.app": "hub",
  "invest-note.pixelwave.app": "invest-note",
  "today-alive.pixelwave.app": "today-alive",
};

function resolveSite(host: string): Site {
  const hostname = host.split(":")[0].toLowerCase();
  return SITE_BY_HOST[hostname] ?? "hub";
}

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const site = resolveSite(host);
  const url = req.nextUrl.clone();

  // 직접 /hub|/invest-note|/today-alive 로 접근하면 그대로 (dev 검증/우회용).
  const alreadyPrefixed = SITES.some(
    (s) => url.pathname === `/${s}` || url.pathname.startsWith(`/${s}/`),
  );
  if (alreadyPrefixed) return NextResponse.next();

  url.pathname = `/${site}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // _next 자산, api, favicon, 파일 확장자 있는 정적 자산은 미들웨어 건너뜀.
  matcher: ["/((?!_next/|api/|favicon\\.ico$|.*\\.[a-zA-Z0-9]+$).*)"],
};
