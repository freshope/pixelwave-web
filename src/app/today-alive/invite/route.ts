import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 초대 SMS 본문에 들어가는 https://today-alive.pixelwave.app/invite 링크.
// iOS UA → App Store, 그 외(Android·데스크탑·빈 UA) → Play Store 로 302.
// HEAD 도 동일 응답이라 SMS/메신저 미리보기에서 스토어 미리보기가 잡힌다.

const IOS_UA_MARKERS = ["iPhone", "iPad", "iPod"];
const IOS_STORE_URL = "https://apps.apple.com/kr/app/id6768927444";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.pixelwave.todayalive";

function isIos(userAgent: string): boolean {
  return IOS_UA_MARKERS.some((marker) => userAgent.includes(marker));
}

function targetFor(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  return isIos(ua) ? IOS_STORE_URL : ANDROID_STORE_URL;
}

export function GET(req: NextRequest) {
  return NextResponse.redirect(targetFor(req), 302);
}

export function HEAD(req: NextRequest) {
  return NextResponse.redirect(targetFor(req), 302);
}
