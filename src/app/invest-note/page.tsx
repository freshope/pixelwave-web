import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import analysisShot from "../../../public/images/invest-note-analysis.png";

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

const BRAND_BLUE = "text-[#0051d5]";
const CARD =
  "rounded-xl border border-slate-200 bg-white/80 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-[#0051d5]";

function Icon({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function StoreBadges({ justify }: { justify: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${justify}`}>
      <a
        href={APPSTORE_URL}
        aria-label="App Store 에서 받기"
        className="transition-transform active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/badges/app-store-ko.svg"
          alt="App Store에서 다운로드"
          width={156}
          height={48}
          className="h-12 w-auto"
        />
      </a>
      <a
        href={PLAY_URL}
        aria-label="Google Play 에서 받기"
        className="transition-transform active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/badges/google-play-ko.png"
          alt="Google Play에서 다운로드"
          width={140}
          height={54}
          className="h-[54px] w-auto"
        />
      </a>
    </div>
  );
}

export default function InvestNoteLandingPage() {
  return (
    <main>
      {/* body 전역 패딩(40px 20px 80px) 상쇄 — 랜딩 섹션은 풀블리드 */}
      <div className="-mx-5 -mt-10 text-[#191c1e]">
        {/* Hero */}
        <section className="overflow-hidden bg-[radial-gradient(circle_at_top_right,#f2f4f6_0%,#f7f9fb_100%)] py-12">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-6 md:flex-row">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h1 className="text-4xl leading-[1.2] font-bold tracking-[-0.02em] text-black md:text-[56px]">
                흩어진 계좌,
                <br />
                한눈에 보는 포트폴리오
              </h1>
              <p className="mx-auto max-w-xl text-lg text-slate-600 md:mx-0">
                매매 이유와 감정까지 기록해 내 매매 패턴을 데이터로 객관화하는
                매매일지 앱
              </p>
              <div className="pt-4">
                <StoreBadges justify="justify-center md:justify-start" />
              </div>
            </div>
            <div className="relative flex-1">
              <div className="relative z-10 mx-auto w-full max-w-[320px]">
                <div className="overflow-hidden rounded-[3rem] border-8 border-slate-200 drop-shadow-2xl">
                  <Image
                    src={analysisShot}
                    alt="투자노트 분석 화면 — 승률, 실현손익, 투자 행동 프로필"
                    priority
                  />
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -z-0 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0051d5]/5 blur-3xl" />
            </div>
          </div>
        </section>

        {/* Features bento */}
        <section className="bg-[#f7f9fb] py-12">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mb-8">
              <span
                className={`text-xs font-medium tracking-widest ${BRAND_BLUE}`}
              >
                핵심 기능
              </span>
              <h2 className="mt-1 text-[32px] leading-10 font-semibold text-black">
                데이터로 증명하는 투자 습관
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              {/* 3초 매매 입력 */}
              <article className={`${CARD} flex flex-col justify-between md:col-span-8`}>
                <div>
                  <Icon className={`mb-4 h-9 w-9 ${BRAND_BLUE}`}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </Icon>
                  <h3 className="mb-3 text-2xl font-semibold text-black">
                    3초 매매 입력
                  </h3>
                  <p className="m-0 max-w-md text-slate-600">
                    불필요한 단계를 제거했습니다. 가격, 수량, 간단한 메모만으로
                    빠르게 기록하고 다시 시장의 흐름에 집중하세요.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-4">
                  <span className="font-mono text-sm text-slate-500">
                    기록 중...
                  </span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-[#dbe1ff]">
                    <div className="h-full w-2/3 bg-[#316bf3]" />
                  </div>
                </div>
              </article>

              {/* 일괄 등록 */}
              <article className={`${CARD} md:col-span-4`}>
                <Icon className={`mb-4 h-9 w-9 ${BRAND_BLUE}`}>
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M12 12v6" />
                  <path d="m15 15-3-3-3 3" />
                </Icon>
                <h3 className="mb-3 text-xl font-semibold text-black">
                  일괄 등록
                </h3>
                <p className="m-0 text-sm text-slate-600">
                  PDF 또는 Excel 파일을 업로드하면 복잡한 거래 내역을 지능적으로
                  분류하고 자동 정리합니다.
                </p>
              </article>

              {/* 계좌 통합 관리 */}
              <article className={`${CARD} md:col-span-4`}>
                <Icon className={`mb-4 h-9 w-9 ${BRAND_BLUE}`}>
                  <line x1="3" x2="21" y1="22" y2="22" />
                  <line x1="6" x2="6" y1="18" y2="11" />
                  <line x1="10" x2="10" y1="18" y2="11" />
                  <line x1="14" x2="14" y1="18" y2="11" />
                  <line x1="18" x2="18" y1="18" y2="11" />
                  <polygon points="12 2 20 7 4 7" />
                </Icon>
                <h3 className="mb-3 text-xl font-semibold text-black">
                  계좌 통합 관리
                </h3>
                <p className="m-0 text-sm text-slate-600">
                  국내외 흩어진 모든 증권사 계좌를 한데 모아 비중, 평가손익,
                  실현손익을 실시간으로 추적합니다.
                </p>
              </article>

              {/* 패턴 분석 */}
              <article className={`${CARD} items-center gap-8 md:col-span-8 md:flex`}>
                <div className="flex-1">
                  <Icon className={`mb-4 h-9 w-9 ${BRAND_BLUE}`}>
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </Icon>
                  <h3 className="mb-3 text-2xl font-semibold text-black">
                    데이터 기반 패턴 분석
                  </h3>
                  <p className="m-0 text-slate-600">
                    승률, 전략별 수익성, 매매 당시의 감정 상태를 분석하여 어떤
                    판단이 실제 수익으로 이어졌는지 객관적으로 확인하세요.
                  </p>
                </div>
                <div className="mt-4 flex flex-1 flex-col gap-2 md:mt-0">
                  <div className="flex h-8 items-center justify-between rounded border border-green-100 bg-green-50 px-3">
                    <span className="text-[10px] font-bold text-green-700">
                      승률
                    </span>
                    <span className="font-mono text-sm text-green-800">
                      68.4%
                    </span>
                  </div>
                  <div className="flex h-8 items-center justify-between rounded border border-blue-100 bg-blue-50 px-3">
                    <span className="text-[10px] font-bold text-blue-700">
                      전략 · 단타
                    </span>
                    <span className="font-mono text-sm text-blue-800">
                      +12.5%
                    </span>
                  </div>
                  <div className="flex h-8 items-center justify-between rounded border border-orange-100 bg-orange-50 px-3">
                    <span className="text-[10px] font-bold text-orange-700">
                      감정 · 뇌동매매
                    </span>
                    <span className="font-mono text-sm text-orange-800">
                      -4.2%
                    </span>
                  </div>
                </div>
              </article>

              {/* 2년 자산 추이 */}
              <article className={`${CARD} flex flex-col items-center gap-6 md:col-span-12 md:flex-row`}>
                <div className="md:w-1/3">
                  <Icon className={`mb-4 h-9 w-9 ${BRAND_BLUE}`}>
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </Icon>
                  <h3 className="mb-3 text-xl font-semibold text-black">
                    2년 자산 추이
                  </h3>
                  <p className="m-0 text-sm text-slate-600">
                    단기 변동성에 일희일비하지 마세요. 최대 2년의 장기 자산
                    흐름을 시각화하여 당신의 성장을 증명합니다.
                  </p>
                </div>
                <div
                  className="flex h-32 w-full items-end gap-1 px-1 md:w-2/3"
                  aria-hidden="true"
                >
                  {[20, 35, 30, 50, 45, 65, 60, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-[#b4c5ff]/30"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                  <div className="h-[95%] flex-1 rounded-t-sm bg-[#0051d5]" />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="bg-slate-100 py-8">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="flex flex-col items-center justify-center gap-8 text-center md:flex-row md:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className={`h-8 w-8 ${BRAND_BLUE}`}>
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </Icon>
              </div>
              <div className="max-w-2xl">
                <h3 className="mb-2 text-xl font-semibold text-black">
                  안전한 데이터 격리 및 보안
                </h3>
                <p className="m-0 text-slate-600">
                  거래 데이터는 계정별로 격리되어 본인만 접근할 수 있으며, 모든
                  전송 구간은{" "}
                  <span className="font-bold text-black">HTTPS 암호화</span>로
                  보호됩니다. 당신의 투자 아이디어는 안전하게 보관됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#131b2e] py-12">
          <div className="mx-auto max-w-[1280px] space-y-8 px-6 text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-white md:text-[40px] md:leading-[48px]">
              지금 바로 투자의 질을 바꾸세요
            </h2>
            <p className="mx-auto max-w-xl text-lg text-[#bec6e0]">
              무분별한 매매를 멈추고 데이터로 당신의 실력을 증명할 시간입니다.
              <br />
              투자노트와 함께 체계적인 투자 여정을 시작하세요.
            </p>
            <div className="pt-2">
              <StoreBadges justify="justify-center" />
            </div>
          </div>
        </section>
      </div>

      <div className="wrap-wide">
        <Footer
          siteName="pixelwave"
          links={[
            { href: "/privacy", label: "개인정보처리방침" },
            { href: "/terms", label: "서비스 이용약관" },
          ]}
          supportEmail="support@pixelwave.app"
        />
      </div>
    </main>
  );
}
