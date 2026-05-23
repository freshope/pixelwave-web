// 초대 SMS 본문에 들어가는 `https://today-alive.pixelwave.app/invite` 링크 처리.
// User-Agent 가 iPhone/iPad/iPod 이면 App Store, 그 외(Android·데스크탑·빈 UA)는 Play Store 로 302.
// HEAD 도 동일 응답 — SMS/메신저 앱 링크 미리보기에서 스토어 미리보기가 뜨도록.
//
// 그 외 경로는 모두 정적 자산으로 fall-through 한다.

const IOS_UA_MARKERS = ["iPhone", "iPad", "iPod"];
const IOS_STORE_URL = "https://apps.apple.com/kr/app/id6768927444";
const ANDROID_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.pixelwave.todayalive";

function isIos(userAgent) {
  return IOS_UA_MARKERS.some((marker) => userAgent.includes(marker));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/invite") {
      const ua = request.headers.get("user-agent") ?? "";
      const target = isIos(ua) ? IOS_STORE_URL : ANDROID_STORE_URL;
      return Response.redirect(target, 302);
    }
    return env.ASSETS.fetch(request);
  },
};
