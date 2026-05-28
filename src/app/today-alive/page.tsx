import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

const TITLE = "오늘 하루 — 하루 한 번 생존 신고";
const DESC =
  "하루 한 번 생존 신고로 살아온 일수를 쌓고, 미클릭이 누적되면 가족·지인에게 안부 메시지를 보냅니다.";
const URL = "https://today-alive.pixelwave.app/";
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=app.pixelwave.todayalive";
const APPSTORE_URL = "https://apps.apple.com/kr/app/id6768927444";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: {
    title: "오늘 하루",
    description: DESC,
    url: URL,
    type: "website",
  },
};

export default function TodayAliveLandingPage() {
  return (
    <main className="wrap-wide">
      <section className="hero">
        <h1>오늘 하루</h1>
        <p className="lede">
          하루 한 번 “생존 신고” 버튼으로 살아온 일수를 쌓습니다. 미클릭이
          누적되면 지정한 가족·지인에게 안부 메시지를 보내, 외로움과 고립의
          임계점을 함께 지킵니다.
        </p>
        <div className="store-badges">
          <a href={PLAY_URL} aria-label="Google Play 에서 받기">
            ▶ Google Play
          </a>
          <a href={APPSTORE_URL} aria-label="App Store 에서 받기">
            App Store
          </a>
        </div>
      </section>

      <section className="features">
        <article className="feature">
          <h3>하루 한 번 생존 신고</h3>
          <p>
            매일 한 번 버튼을 눌러 오늘을 기록합니다. 살아온 일수가 자연스럽게
            쌓여 일상에 작은 리듬을 만듭니다.
          </p>
        </article>
        <article className="feature">
          <h3>맞춤 알림</h3>
          <p>
            원하는 시간에 알림을 받아 잊지 않고 신고할 수 있습니다. 기본은 오전
            10시, 언제든 끄거나 바꿀 수 있습니다.
          </p>
        </article>
        <article className="feature">
          <h3>위급 메시지 자동 발송</h3>
          <p>
            1·3·5일 중 선택한 주기 동안 신고가 없으면, 미리 적어둔 메시지를
            지정한 연락처로 보냅니다.
          </p>
        </article>
        <article className="feature">
          <h3>최소한의 개인정보</h3>
          <p>
            이름·생년월일·연락처는 알림과 위급 메시지에만 사용합니다. 통신
            구간은 HTTPS 로 암호화됩니다.
          </p>
        </article>
      </section>

      <Footer
        siteName="pixelwave"
        links={[
          { href: "/privacy", label: "개인정보처리방침" },
          { href: "/terms", label: "서비스 이용약관" },
        ]}
        supportEmail="support@pixelwave.app"
      />
    </main>
  );
}
