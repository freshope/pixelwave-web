# Decisions

> 마이그레이션 진행 중 내린 주요 결정. ADR-lite — 결정 사항 / 이유 / 영향. 시간 순.

## D-01. 백엔드는 Next.js 단독 (FastAPI 도입 안 함) — 2026-05-28
- **결정**: Route Handlers + Postgres 로 v1 의 모든 백엔드 처리.
- **이유**: v1 규모(저트래픽 랜딩 + 소규모 게시판)에 FastAPI 도입 부담이 큼. 필요해지면 후속 작업.
- **영향**: 모바일 앱과의 API 공유는 비목표 (별도 프로젝트가 처리).

## D-02. 단일 Next.js 앱 + host 기반 라우팅 — 2026-05-28
- **결정**: 3개 앱으로 쪼개지 않고 한 컨테이너가 host 헤더로 분기.
- **이유**: 운영 자원/빌드 파이프라인 단일화. 공통 컴포넌트 재사용 쉬움.
- **영향**: `src/proxy.ts` 가 host → site prefix rewrite. matcher 에서 `_next`/`api`/정적 파일 제외 필수.

## D-03. 허브 중심 정본 / 서브도메인 화이트리스트 노출 — 2026-05-28
- **결정**: 모든 게시판 정본 URL = `https://pixelwave.app/b/<board>/<post>`. 서브도메인은 `board_sites` 통과 시만 SSR + canonical 은 허브로.
- **이유**: SEO 중복 색인 방지 + 보드 메타 관리 단순화.
- **영향**: 모든 site 의 `/b/...` 페이지가 `alternates.canonical = hub URL`.

## D-04. 공유 Postgres 인스턴스 — 2026-05-28
- **결정**: `postgres-shared` 컨테이너 하나에 앱별 분리 DB/유저(`pixelwave/pixelwave`). `max_connections = 100`.
- **이유**: 향후 다른 프로젝트도 같은 인스턴스에 들어올 수 있도록.
- **영향**: 인스턴스 단위 백업. 합산 연결수 50 초과 시 §3.7 트리거 재검토.

## D-05. 인증: NextAuth + GitHub OAuth + ADMIN_GITHUB_IDS — 2026-05-28
- **결정**: v1 은 admin 1명. session strategy = JWT (DB session 미사용). signIn 콜백에서 화이트리스트 검증.
- **이유**: 권한 모델 최소화. 운영 단순.
- **영향**: 다중 작성자 도입 시 NextAuth role 확장 + users 테이블 활용 필요.

## D-06. Next.js standalone + Coolify + 자체 registry — 2026-05-28
- **결정**: `output: 'standalone'` 으로 빌드, Coolify 가 `registry.pixelwave.app/pixelwave-web:<sha>` 를 pull.
- **이유**: 운영 박스에서 `next build` 하지 않음 (4GB 박스 OOM 위험). CI 빌드 + 운영 pull 만.
- **영향**: registry 인프라 별도 운영. GHA workflow 가 빌드 + push 책임.

## D-07. 레지스트리: 자체 `registry:2` + Cloudflare R2 — 2026-05-28
- **결정**: GHCR/Docker Hub 대신 `registry.pixelwave.app` (registry:2) + R2 백엔드.
- **이유**: 비용 0 (R2 무료 한도). 운영 종속 줄임. Coolify 박스 디스크/메모리 부담 0.
- **영향**: htpasswd 인증 + Traefik LE. 다른 프로젝트도 공유 가능.

## D-08. Postgres 백업 → Cloudflare R2 — 2026-05-28
- **결정**: 별도 버킷 `pixelwave-backups` + 별도 토큰 `pixelwave-backups-rw`. Coolify 글로벌 S3 Storage `pixelwave-r2-backups` 로 credential 중앙 관리.
- **이유**: registry 와 권한 분리. 토큰 유출 시 영향 한정. Postgres 리소스 env 에 R2 키 노출 안 됨.
- **영향**: 키 회전 시 한 곳만 갱신. 다른 DB/앱도 같은 storage 재사용 가능.

## D-09. 폴더 구조 `src/app` + 일반 폴더 라우팅 — 2026-05-28
- **결정**: `src/app/<site>/...` (route group `()` 미사용). tsconfig paths `@/*` → `./src/*`.
- **이유**: 초기 plan 의 route group `(hub)` 은 `/` path 가 3 곳에서 충돌. 일반 폴더 + middleware rewrite 가 Next.js multi-tenant 표준.
- **영향**: docs §3.1 초안 정정.

## D-10. Next.js 16 의 `middleware` → `proxy` 컨벤션 — 2026-05-28
- **결정**: 파일명 `src/middleware.ts` → `src/proxy.ts`, named export `middleware` → `proxy`.
- **이유**: Next.js 16 의 deprecation 메시지 (`The "middleware" file convention is deprecated. Please use "proxy" instead.`). AGENTS.md 가 사전 경고.
- **영향**: 동작 동일. 향후 16.x 업그레이드 안전.

## D-11. CF 프록시 OFF 로 시작 — 2026-05-28
- **결정**: 모든 운영 도메인 Proxy OFF (gray cloud). 안정화 후 ON 검토.
- **이유**: LE 발급 단순화. 마이그레이션 직후 디버그 변수 최소화. v1 트래픽 적어 캐싱/DDoS 이점 약함.
- **영향**: revalidatePath → CF cache 미연동 위험 회피. Coolify 호스트 IP 가 외부에 노출됨.

## D-12. GHA buildx — provenance/sbom/oci-mediatypes 모두 끔 — 2026-05-28
- **결정**: `provenance: false`, `sbom: false`, `outputs: type=registry,oci-mediatypes=false`.
- **이유**: `registry:2` 가 buildx 의 OCI attestation/index manifest 거부 → "unknown: unknown error".
- **영향**: docker schema2 단일 image manifest 만 push. 미래 OCI 표준 강제 시 재검토.

## D-13. registry `REGISTRY_STORAGE_S3_CHUNKSIZE=100MB` — 2026-05-28
- **결정**: 10MB(default) → 100MB.
- **이유**: layer > 10MB 일 때 multipart upload 사용. R2 의 S3 API 가 part listing 즉시 일관성 미보장 → "s3aws: Path not found".
- **영향**: 우리 image 의 거의 모든 layer 가 single PUT 으로 push. 더 큰 layer 발생 시 chunksize 추가 상향 필요.

## D-14. staging 사용 안 함 — 2026-05-28
- **결정**: `next.pixelwave.app` 도메인 폐기. dev 검증은 로컬, main 머지 후 운영 직접 적용.
- **이유**: 운영 도메인이 Coolify 로 이전된 시점에 staging 의 효용 약함. 운영 자원 단순화.
- **영향**: `proxy.ts` 의 SITE_BY_HOST 에서 `next.pixelwave.app` 매핑 제거. Coolify Domains/CF DNS/OAuth callback 정리.

## D-15. hub redirect 유지 (Phase 4.5 미적용) — 2026-05-29
- **결정**: `pixelwave.app/*` → invest-note 301 그대로. hub 랜딩 "최근 글" 인덱스 교체 안 함.
- **이유**: 사용자 결정. 게시판 노출은 정본 path(`/b/...`) 와 서브도메인으로 충분.
- **영향**: `HUB_NONREDIRECT_PREFIXES = ['/admin', '/login', '/b']` 만 hub site rewrite. 향후 hub 랜딩이 필요해질 때 재논의.

## D-16. Coolify image pull 캐시 우회 — 2026-05-29
- **결정**: 운영 image tag 를 매 release 마다 **immutable short-sha** 로 박는다.
- **이유**: `:main` mutable tag 갱신 후에도 Coolify 가 cached image 그대로 사용하는 사례. sha 명시 시 docker 가 무조건 새 manifest 조회.
- **영향**: release 마다 사용자가 Coolify Image Tag 필드 갱신. 향후 webhook 자동화 검토.

## D-17. docs 4분리 — 2026-05-29
- **결정**: `docs/migration-plan.md` 제거 후 `roadmap.md` / `backlog.md` / `decisions.md` / `spec-current.md` 4개로 분리.
- **이유**: 마이그레이션은 종료. history 문서가 운영 reference 와 섞이면 가독성 떨어짐.
- **영향**: README 의 docs 링크 갱신.

## D-18. git 태그(`v*`) 기반 이미지 버전 추적 — 2026-05-29
- **결정**: build.yml 트리거에 `tags: ['v*']` 추가. 이미지 태그를 ref 종류별로 — 브랜치 push → `:<short-sha>` + `:main|:develop`, `v*` 태그 push → `:<short-sha>` + `:v1.2.3` + `:latest`.
- **이유**: short-sha 만으로는 R2 registry 의 `_manifests/tags/` 에서 "내가 푸시한 버전" 을 찾기 어려움 (날짜·브랜치·순서 정보 없음). git 태그명이 곧 이미지 태그가 되어 `_manifests/tags/v1.2.3/` 로 즉시 식별 가능. [[D-16]] 의 immutable short-sha pull 정책과 병행.
- **영향**: 릴리즈 시 `git tag v1.2.3 && git push origin v1.2.3`. `meta.branch` output → `meta.ref` 로 정정(태그 push 때 의미 일치). `:latest` 는 v* 태그에서만 갱신되는 mutable 핸들. `environment: production` 이 태그 push 에도 적용되므로 승인 규칙 존재 시 태그 빌드도 대기.

## D-19. Coolify 자동 배포 — GHA deploy API 트리거 — 2026-05-29
- **결정**: v* 태그 push 시 GHA 가 빌드+push 완료 직후 Coolify deploy API(`GET /api/v1/deploy?uuid=...`)를 호출해 자동 배포. main 브랜치 트리거는 제거하고 태그 빌드가 `:main` 도 함께 부여(release 시 main+tag 이중 빌드 제거).
- **이유**: 트리거 주체는 "registry 에 새 이미지가 올라온 걸 아는 자"여야 함 = GHA. GitHub git webhook 은 push(=빌드 전) 시점에 떠서 직전 이미지를 배포하는 race 존재. 또 기존 "자동 배포" 는 실제로 없었음 — webhook 미등록, 전 배포가 Manual 이었음. [[D-16]] 의 image tag PATCH 안은 캐시 대응이라 트리거와 분리.
- **영향**: `COOLIFY_URL`/`COOLIFY_APP_UUID`/`COOLIFY_API_TOKEN` GHA secret + Coolify Settings 의 API 활성화(기본 off) 필요. 배포 이미지 반영 확인용 `/api/version`(빌드 sha/ref/시각 노출) 추가. `:latest` mutable 태그로도 캐시 문제 미발생 확인 → PATCH 안(D-16)은 보류, 재발 시 적용.
