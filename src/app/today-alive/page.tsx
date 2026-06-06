import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import checkinShot from "../../../public/images/today-alive-checkin.png";

const TITLE = "오늘 하루 — 하루 한 번 데일리 체크인";
const DESC =
  "하루 한 번 버튼으로 오늘을 기록하세요. 체크인이 끊기면 지정한 연락처로 안부 메시지를 보내는 안전장치를 제공합니다.";
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
        target="_blank"
        rel="noopener noreferrer"
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
        target="_blank"
        rel="noopener noreferrer"
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

const FEATURES = [
  {
    title: "하루 한 번 체크인",
    body: "버튼 한 번으로 오늘을 기록합니다. 쌓이는 날들이 일상의 리듬이 됩니다.",
    circle: "bg-[#ffedd5] text-[#695d4a]",
    icon: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </>
    ),
  },
  {
    title: "맞춤 알림",
    body: "원하는 시간에 부드럽게 알려드립니다. 기본은 오전 10시, 언제든 바꿀 수 있습니다.",
    circle: "bg-[#ffeddb] text-[#755935]",
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
  },
  {
    title: "나만의 테마",
    body: "배경과 테마를 취향대로 바꿔보세요.",
    circle: "bg-[#e6dfd5] text-[#625e56]",
    icon: (
      <>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </>
    ),
  },
];

export default function TodayAliveLandingPage() {
  return (
    <main>
      {/* body 전역 패딩(40px 20px 80px) 상쇄 — 랜딩 섹션은 풀블리드 */}
      <div className="-mx-5 -mt-10 bg-[#fdf9e9] text-[#1c1c13]">
        {/* Hero */}
        <section className="overflow-hidden py-12">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl leading-[1.25] font-bold tracking-[-0.02em] text-[#1c1c13] md:text-[44px]">
                오늘 하루 어땠나요?
              </h1>
              <p className="mx-auto max-w-lg text-lg text-[#4c463e] lg:mx-0">
                하루 한 번, 버튼 하나로 오늘을 기록하세요. 쌓이는 하루하루가
                소중한 사람에게 안부가 됩니다.
              </p>
              <div className="pt-4">
                <StoreBadges justify="justify-center lg:justify-start" />
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -z-0 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffedd5]/40 blur-3xl" />
              <div className="relative z-10 mx-auto max-w-[300px] rounded-[3rem] border border-[#cfc5ba]/30 bg-[#f8f4e4] p-5 shadow-[0_10px_40px_-10px_rgba(230,192,149,0.5)]">
                <Image
                  src={checkinShot}
                  alt="오늘 하루 체크인 화면 — '오늘 하루' 버튼"
                  className="rounded-[2rem]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="rounded-[2rem] border border-[#cfc5ba]/20 bg-[#f8f4e4] p-8 transition-colors duration-500 hover:bg-[#f2eede]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${f.circle}`}
                  >
                    <Icon className="h-6 w-6">{f.icon}</Icon>
                  </div>
                  <h3 className="mt-4 mb-3 text-xl font-semibold text-[#1c1c13]">
                    {f.title}
                  </h3>
                  <p className="m-0 text-[#4c463e]">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="bg-[#f2eede] py-12">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="flex flex-col items-center gap-12 rounded-[3rem] border border-[#cfc5ba]/30 bg-white p-8 md:flex-row md:p-16">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#ffedd5] px-4 py-1 text-sm font-medium text-[#786b57]">
                  <Icon className="h-4 w-4">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </Icon>
                  안부 안전장치
                </div>
                <h2 className="text-[28px] leading-snug font-semibold text-[#1c1c13]">
                  혹시를 위한 안부 알림
                </h2>
                <p className="m-0 text-lg text-[#4c463e]">
                  설정한 기간(1·3·5일) 동안 체크인이 없으면, 미리 적어둔
                  메시지를 지정한 연락처로 전합니다. 이름·생년월일·연락처는
                  알림에만 사용하며 전송 구간은 HTTPS로 암호화됩니다.
                </p>
              </div>
              <div className="flex flex-1 justify-center">
                <div className="relative">
                  <div className="absolute inset-0 scale-110 rounded-full bg-[#695d4a]/10 blur-xl" />
                  <Icon className="relative h-[120px] w-[120px] text-[#695d4a] [stroke-width:1]">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z" />
                  </Icon>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12">
          <div className="mx-auto max-w-[1280px] space-y-8 px-6 text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#1c1c13] md:text-[40px]">
              다시 시작하는 오늘의 리듬
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[#4c463e]">
              지금 바로 다운로드하고 당신의 소중한 일상을 안전하게 기록하세요.
            </p>
            <div className="pt-2">
              <StoreBadges justify="justify-center" />
            </div>
          </div>
        </section>
      </div>

      {/* 구분선은 풀블리드, 푸터 내용은 wrap-wide 폭 유지. 시안의 푸터 배경색으로 하단까지 채움 */}
      <div className="-mx-5 -mb-20 border-t border-[#cfc5ba]/60 bg-[#f2eede]">
        <div className="mx-auto max-w-[960px] px-5 pb-10">
          <Footer
            className="mt-0 border-t-0"
            siteName="pixelwave"
            links={[
              { href: "/privacy", label: "개인정보처리방침", newTab: true },
              { href: "/terms", label: "서비스 이용약관", newTab: true },
            ]}
            supportEmail="support@pixelwave.app"
          />
        </div>
      </div>
    </main>
  );
}
