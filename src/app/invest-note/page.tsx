import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

const TITLE = "투자노트 — 매매 기록과 포트폴리오 분석";
const DESC =
  "매매 기록을 자동으로 정리하고 손익·포트폴리오를 한눈에 확인하는 투자 기록 앱.";
const URL = "https://invest-note.pixelwave.app/";
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=app.pixelwave.investnote";
const APPSTORE_URL = "https://apps.apple.com/kr/app/id6769310576";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: {
    title: "투자노트",
    description: DESC,
    url: URL,
    type: "website",
  },
};

export default function InvestNoteLandingPage() {
  return (
    <main className="wrap-wide">
      <section className="hero">
        <h1>투자노트</h1>
        <p className="lede">
          증권사 거래내역을 가져오면 손익·평균단가·포트폴리오를 자동으로
          정리합니다. 매매 이유와 복기를 함께 기록해 다음 결정을 더 나은
          결정으로 바꿉니다.
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
          <h3>거래내역 자동 정리</h3>
          <p>
            주요 증권사 거래내역 파일을 업로드하면 종목별 매매·평균단가·실현손익을
            자동으로 계산합니다.
          </p>
        </article>
        <article className="feature">
          <h3>포트폴리오 한눈에</h3>
          <p>
            보유 종목, 비중, 평가손익, 실현손익을 하나의 화면에서 추적합니다.
          </p>
        </article>
        <article className="feature">
          <h3>매매 메모와 복기</h3>
          <p>
            매수·매도 시점의 판단 이유를 함께 기록해 의사결정 패턴을 회고합니다.
          </p>
        </article>
        <article className="feature">
          <h3>안전한 보관</h3>
          <p>
            거래 데이터는 계정별로 격리되어 본인만 접근할 수 있으며 전송 구간은
            HTTPS 로 암호화됩니다.
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
