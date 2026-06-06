# Spec: 오늘 하루(today-alive) 랜딩 페이지 리디자인 (Stitch 시안 이식)

> 완료: 2026-06-06

## 배경 / 문제

backlog P1 항목. invest-note(2026-06-06 완료)와 동일 흐름 — Stitch 확정 시안(HTML, 검토 통과)을
`docs/design.md` 브리프 2 기준으로 이식한다. 선결 이슈였던 `@layer base`(D-21)는 이미 적용되어 있어 바로 이식 가능.

## 목표

- today-alive 랜딩이 Stitch 확정 시안과 동등한 디자인(히어로/기능 3카드/안부 안전장치/CTA/푸터, 크림·피치 팔레트)으로 렌더링된다.
- 서버 컴포넌트 유지, 외부 폰트(Plus Jakarta Sans 등)·JS(reveal/parallax) 미사용.
- **포지셔닝 전환**: `metadata`(title/description/og)를 "생존 신고" → **데일리 체크인** 중심으로 갱신 (design.md 주의 1).
  - TITLE: `오늘 하루 — 하루 한 번 데일리 체크인`
  - DESC: `하루 한 번 버튼으로 오늘을 기록하세요. 체크인이 끊기면 지정한 연락처로 안부 메시지를 보내는 안전장치를 제공합니다.`
- invest-note 에서 확정된 후속 수정 동일 적용: 푸터 구분선 풀블리드, 스토어 배지·법무 링크 새창(`newTab`).
- **레거시 랜딩 CSS 제거**: 양쪽 랜딩 이식 완료 조건 충족 → `globals.css` 의 `.features`/`.feature`/`.store-badges` 제거.
  단, `.hero`(+`.lede`)는 **hub placeholder(`src/app/hub/page.tsx`)가 사용 중이므로 유지**.
- invest-note·hub·법무 페이지 렌더링이 변하지 않는다.

## 설계

### 접근 방식

1. **page.tsx 전면 재작성** — Stitch HTML → Tailwind v4 유틸리티 JSX (invest-note 패턴 재사용)
   - 풀블리드: 섹션 래퍼 `-mx-5 -mt-10 bg-[#fdf9e9]`. 푸터 블록은 `-mx-5 -mb-20 border-t border-[#cfc5ba]/60 bg-[#f2eede]`(시안의 푸터 배경색)로 화면 하단까지 채움 + 내용은 960px 컨테이너 + `<Footer className="mt-0 border-t-0">`.
   - 팔레트(arbitrary): 페이지 `#fdf9e9`, 카드 `#f8f4e4`, 푸터/섹션 `#f2eede`, 텍스트 `#1c1c13`/`#4c463e`, 브랜드 브라운 `#695d4a`, 피치 배지 `#ffedd5`/`#786b57`, 아이콘 서클 3색(`#ffedd5`·`#ffeddb`·`#e6dfd5`), 보더 `#cfc5ba` 투명도 변형.
   - 라운드: 기능 카드 `rounded-[2rem]`, 히어로 목업 카드·안전장치 카드 `rounded-[3rem]`, 배지 pill `rounded-full` (시안의 soft radii 재현).
   - 아이콘: 인라인 SVG(lucide) — calendar-check(체크인), bell(알림), palette(테마), 안전장치 대형 아이콘은 `shield_with_heart` 부재로 **heart** 로 대체(+blur glow).
   - 섹션: 히어로(2col, 좌 카피+배지 / 우 크림 카드 + 앱 스크린샷 + glow) → 기능 3카드 → 안전장치(흰 카드, "안부 안전장치" 피치 pill + "혹시를 위한 안부 알림") → CTA("다시 시작하는 오늘의 리듬") → 푸터.
   - 스토어 배지: 기존 `public/images/badges/` 에셋 재사용, `target="_blank" rel="noopener noreferrer"`.
   - 카피: design.md 브리프 2 + 2차 시안 확정 텍스트 그대로 (감정/다짐 표현 금지 준수).

2. **에셋**: `~/Downloads/스크린샷/오늘하루/400x800bb (1).png`(따뜻한 방 + "오늘 하루" 체크인 버튼, 370×800) → `public/images/today-alive-checkin.png` 복사. `next/image` static import. 저해상도라 표시폭 ~300px 이하 유지.

3. **레거시 CSS 제거**: 이식 후 `grep` 으로 `.features`/`.feature`/`.store-badges` 사용처 0건 확인 → `globals.css` 에서 해당 블록 삭제. `.hero` 계열은 hub 사용 중이라 보존.

### 주요 변경 파일

- `src/app/today-alive/page.tsx` — 전면 재작성 (서버 컴포넌트, metadata 갱신 포함)
- `public/images/today-alive-checkin.png` — 신규 에셋
- `src/app/globals.css` — `.features`/`.feature`/`.store-badges` 블록 제거
- `docs/spec-current.md` — 본 사양서 저장

## 구현 체크리스트

- [x] 에셋: 스크린샷 (1) → `public/images/today-alive-checkin.png` 복사
- [x] `src/app/today-alive/page.tsx` 재작성 (metadata 데일리 체크인 포지셔닝, 푸터 풀블리드·새창 패턴 포함)
- [x] `globals.css` 레거시 랜딩 CSS 제거 (`grep` 사용처 0건 확인 후)
- [x] 타입 체크 (`pnpm tsc --noEmit`) + `pnpm build` 통과
- [x] 브라우저 검증: today-alive 데스크톱(1280)/모바일(375)·가로 오버플로 없음, invest-note·hub·`/today-alive/privacy` 회귀 없음

## 검증 방법

1. dev 서버(3100, 이미 가동 중) → gstack browse 로 `localhost:3100/today-alive` 데스크톱·모바일 스크린샷, 시안 대조.
2. 레거시 CSS 제거 회귀: invest-note 랜딩(새 코드, 무관), hub(`/hub` — `.hero` 보존 확인), `/today-alive/privacy` 스크린샷.
3. `pnpm tsc --noEmit`, `pnpm build` 클린 통과.

## 우려사항 / 리스크

- 스토어 스크린샷이 370×800 저해상도 — 표시폭 제한으로 열화 방지. 추후 고해상도 시뮬레이터 캡처로 교체 권장(백로그 불필요, 교체는 파일 1개).
- `shield_with_heart` 아이콘 lucide 부재 → heart 로 대체 (무드 동일).
- 시안발 신규 카피("다시 시작하는 오늘의 리듬" 등)는 invest-note 때와 동일하게 보고 후 사용자 거부권.

