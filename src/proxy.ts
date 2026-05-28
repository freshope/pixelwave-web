import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITES = ["hub", "invest-note", "today-alive"] as const;
type Site = (typeof SITES)[number];

const SITE_BY_HOST: Record<string, Site> = {
  "pixelwave.app": "hub",
  "www.pixelwave.app": "hub",
  "invest-note.pixelwave.app": "invest-note",
  "today-alive.pixelwave.app": "today-alive",
};

// Phase 3 의 진짜 허브가 생기기 전까지, 운영 hub 호스트는 invest-note 로 301.
// next.pixelwave.app 은 검증용이라 redirect 대상에서 제외하고 placeholder 노출.
const HUB_REDIRECT_HOSTS = new Set(["pixelwave.app", "www.pixelwave.app"]);
const HUB_REDIRECT_TARGET_ORIGIN = "https://invest-note.pixelwave.app";

function resolveSite(host: string): Site {
  const hostname = host.split(":")[0].toLowerCase();
  return SITE_BY_HOST[hostname] ?? "hub";
}

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();

  if (HUB_REDIRECT_HOSTS.has(hostname)) {
    const target = `${HUB_REDIRECT_TARGET_ORIGIN}${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(target, 301);
  }

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
