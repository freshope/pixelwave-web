# Spec: 투자노트 랜딩 페이지 리디자인 (Stitch 시안 이식)

## 배경 / 문제

invest-note.pixelwave.app 랜딩이 텍스트 위주의 임시 디자인이다. Stitch 로 확정한 시안(HTML)을
`docs/design.md` 브리프·기술 제약에 따라 레포에 이식한다. 허브 도메인이 invest-note 로 301 되므로 실트래픽 최우선 페이지다.

## 목표

- invest-note 랜딩이 Stitch 확정 시안과 동등한 디자인(히어로/벤토 기능 그리드/신뢰/다크 CTA/푸터)으로 렌더링된다.
- 서버 컴포넌트 유지(`"use client"` 없음), 외부 폰트·JS 의존성 없음.
- `metadata`·스토어 URL·`<Footer>` 보존, 시안 잔존 텍스트 결함 2건 수정:
  - 히어로 헤드라인 "흩어진 계좌, 한눈에 보는 **포트폴리오**" 복원 (시안에서 "투자노트"로 잘못 변경됨)
  - CTA 본문 "Invest-Note와 함께" → "투자노트와 함께"
- `/privacy`, `/terms`, hub 페이지 렌더링이 변하지 않는다.

## 설계

### 접근 방식

1. **[선결 이슈] globals.css 베이스 스타일을 `@layer base` 로 래핑**
   - 현재 `h1/h2/h3/p/a/ul/table` 등이 unlayered 라 CSS 캐스케이드상 Tailwind 유틸리티(`@layer utilities`)를 항상 이김 → 랜딩에서 `text-5xl` 등이 무효가 됨.
   - 선언 값은 그대로 두고 `@layer base { ... }` 로 감싸기만 한다. 법무 페이지는 유틸리티를 안 쓰므로 렌더링 동일(Preflight 보다 뒤에 선언되어 같은 레이어 내 후순위 우선). 이 결정은 `docs/decisions.md` 에 기록.
   - `.hero`/`.features`/`.store-badges`/`.site-footer` 등 클래스 스타일은 그대로 둔다(변경 없음).

2. **page.tsx 전면 재작성** — Stitch HTML → Tailwind v4 유틸리티 JSX 변환
   - **풀블리드 처리**: body 에 전역 `padding: 40px 20px 80px` 가 있으므로 섹션 래퍼에 `-mt-10 -mx-5` 네거티브 마진 적용. 푸터는 `wrap-wide` 컨테이너로 복귀.
   - **색상**: 중립색은 표준 팔레트(slate 계열) 근사 매핑, 브랜드 색은 arbitrary value (`#0051d5` 블루, `#131b2e` 다크 네이비, `#316bf3`). config/토큰 추가 없음.
   - **타이포**: 시스템 한글 스택(상속) 사용, Google Fonts(Hanken Grotesk/Inter) 미사용. 데이터 표기는 `font-mono`.
   - **아이콘**: Material Symbols 웹폰트 대신 인라인 SVG 6개(lucide 패스: zap, file-up, landmark, bar-chart, trending-up, shield-check)를 page.tsx 내 로컬 컴포넌트로.
   - **애니메이션**: JS 스크롤 리빌 제거(서버 컴포넌트), hover/active 전환만 유틸리티로 유지.
   - **섹션 구성**(시안 그대로): 히어로(radial gradient + 폰 목업) → 벤토 그리드 5카드(8/4/4/8/12 col) → 신뢰 1줄 → 다크 CTA → 기존 Footer.
   - 자산 추이 미니 바차트 등 장식 div 는 시안 그대로 정적 마크업.

3. **에셋 준비** (`public/images/`)
   - 앱 스크린샷: `~/Downloads/스크린샷/투자노트/...18.43.37 1.png`(분석 화면, 1100×2282) → `sips --resampleWidth 800` 리사이즈 → `public/images/invest-note-analysis.png`. `next/image` static import 로 사용(자동 width/height).
   - 공식 스토어 배지 다운로드:
     - App Store(ko, black): Apple marketing toolbox SVG → `public/images/badges/app-store-ko.svg`
     - Google Play(ko): `ko_badge_web_generic.png` → `public/images/badges/google-play-ko.png`
     - 다운로드 실패 시 폴백: 현행 텍스트형 배지 스타일 유지 후 사용자에게 보고.
   - 배지 `<a>` 에 기존 `aria-label` 유지.

### 주요 변경 파일

- `src/app/invest-note/page.tsx` — 전면 재작성 (서버 컴포넌트, Tailwind 유틸리티)
- `src/app/globals.css` — 베이스 엘리먼트 스타일 `@layer base` 래핑 (값 변경 없음)
- `public/images/invest-note-analysis.png`, `public/images/badges/*` — 신규 에셋
- `docs/decisions.md` — @layer base 결정 기록
- `docs/design.md` — 제약 노트에 @layer base 반영 (이미 untracked 상태 — 이 브랜치 첫 커밋에 포함)
- `docs/spec-current.md` — 본 사양서 저장

## 구현 체크리스트

- [x] 에셋 준비: 스크린샷 리사이즈 복사 + 공식 배지 2종 다운로드 (`public/images/`)
- [x] `globals.css` 베이스 스타일 `@layer base` 래핑
- [x] `src/app/invest-note/page.tsx` 재작성 (텍스트 결함 2건 수정 포함)
- [x] 타입 체크 통과 (`pnpm tsc --noEmit`) + `pnpm build` 통과
- [x] 브라우저 검증: invest-note 랜딩 데스크톱(1280)/모바일(375) 정상, 가로 오버플로 없음, `/invest-note/privacy`·hub 회귀 없음
- [x] `docs/decisions.md`(D-21)·`docs/design.md` 갱신

## 우려사항 / 리스크

- `@layer base` 래핑이 hub/admin 등 다른 페이지에 미묘한 영향 가능 → 전후 스크린샷 비교로 검증.
- 배지 다운로드 URL 변동 가능 → 실패 시 텍스트형 배지 폴백.
- 폰 목업 속 실제 앱 스크린샷의 보라 포인트 컬러가 시안 블루와 상이 — 사용자 인지·승인됨.
- 작업 트리의 untracked `docs/design.md` 는 이 작업 산출물 — feature 브랜치 첫 커밋에 포함.
