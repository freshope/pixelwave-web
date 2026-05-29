# Cloudflare → Coolify (Next.js) 마이그레이션 계획

> 이 문서는 단계별 진행의 기준 문서다. 각 Phase 의 **검증 기준**을 만족시킨 뒤에 다음 Phase 로 넘어간다. 작업 도중 결정이 바뀌면 이 문서를 먼저 갱신하고 코드를 수정한다.

---

## 1. 배경 & 목표

### 현재 상태
- 3개 도메인을 Cloudflare Workers(Static Assets) 로 배포 중.
  - `pixelwave.app` → `sites/hub/` (invest-note 로 301 redirect)
  - `invest-note.pixelwave.app` → `sites/invest-note/` (정적 랜딩 + privacy/terms/account-deletion)
  - `today-alive.pixelwave.app` → `sites/today-alive/` (정적 + `_worker.js` 의 `/invite` UA 분기)
- 공통 자산: `shared/styles/base.css`, `shared/partials/footer.html` (현재 수동 sync)
- 백엔드 API(`api.*.pixelwave.app`)는 별도 프로젝트이며 **이 마이그레이션 범위 밖**.

### 목표
- 동적 기능(멀티 게시판) 도입을 위해 Next.js 로 전환하고 Coolify 에 배포.
- `pixelwave.app` 을 진짜 허브로 승격: **다수의 게시판을 보유**하고, 각 서브도메인이 자신에게 노출 허용된 보드를 자기 호스트에서 SSR 로 보여준다.
- 정적 페이지(랜딩·법적 문서)는 동일 Next.js 앱에 그대로 이식.

### 비목표
- 모바일 앱과의 API 공유, 별도 FastAPI 서비스 신설 — 현 시점에서는 안 함. (필요해지면 후속 작업으로 분리)
- 댓글, 다중 작성자, 이미지 호스팅 외부화(R2/S3) — v1 범위 아님.

---

## 2. 결정 사항 (요약)

| 항목 | 결정 | 비고 |
|---|---|---|
| 백엔드 형태 | **Next.js 단독** (Route Handlers + Postgres) | FastAPI 도입 안 함 |
| 앱 구조 | **단일 Next.js 앱 + host 기반 라우팅** | 3개 앱으로 쪼개지 않음 |
| 보드 모델 | **허브 중심 / 서브도메인은 화이트리스트 노출** | 정본 URL = 허브 |
| DB | **공유 Postgres 인스턴스 1개** (`postgres-shared`), 앱별 분리 DB/유저 | Drizzle ORM 권장 |
| 인증 | NextAuth + GitHub OAuth, 관리자 ID 화이트리스트 | 단일 관리자 가정 |
| 빌드/배포 | Next.js `output: 'standalone'` + Dockerfile, Coolify | 도메인 3개를 동일 컨테이너에 매핑 |
| 이미지 | Coolify persistent volume + Next.js 정적 서빙 | 트래픽 늘면 외부 스토리지 검토 |
| CF 프록시 | proxied off 또는 Origin Cert 사용 | cutover 시 결정 |

---

## 3. 아키텍처

### 3.1 디렉토리 구조 (목표)

```
pixelwave-web/
├─ src/
│  ├─ middleware.ts              ← host 헤더 기준 (hub|invest-note|today-alive) 분기
│  ├─ app/
│  │  ├─ hub/                    ← pixelwave.app (middleware rewrite target)
│  │  │  ├─ page.tsx             ← 허브 랜딩 + 최근 글
│  │  │  ├─ b/[board]/page.tsx   ← 보드 목록
│  │  │  ├─ b/[board]/[post]/page.tsx ← 글 상세 (정본 URL)
│  │  │  └─ admin/*              ← 작성/편집
│  │  ├─ invest-note/            ← invest-note.pixelwave.app
│  │  │  ├─ page.tsx             ← 기존 랜딩 이식
│  │  │  ├─ privacy/page.tsx
│  │  │  ├─ terms/page.tsx
│  │  │  ├─ account-deletion/page.tsx
│  │  │  └─ b/[board]/[post]/... ← 노출 허용된 보드만
│  │  └─ today-alive/            ← today-alive.pixelwave.app
│  │     ├─ page.tsx, privacy/, terms/
│  │     ├─ invite/route.ts      ← UA 분기 (기존 _worker.js 대체)
│  │     └─ b/[board]/[post]/...
│  ├─ components/                ← 기존 shared/ 승격
│  └─ db/
│     ├─ schema.ts               ← Drizzle 스키마
│     └─ migrations/
├─ Dockerfile
├─ next.config.ts
└─ docs/
   └─ migration-plan.md          ← 본 문서
```

### 3.2 데이터 모델 (최소)

```
sites        (slug PK)                              -- ['hub','invest-note','today-alive']
boards       (id, slug UNIQUE, title, owner_site FK→sites, is_public)
board_sites  (board_id FK, site_slug FK)            -- M:N 노출 허용 사이트
posts        (id, board_id FK, slug, title, body_md, published_at, updated_at)
users        (id, github_id, role)                  -- v1 은 admin 1명
```

- 보드의 **정본(canonical) URL** 은 항상 `https://pixelwave.app/b/<board>/<post>`.
- 서브도메인에서 같은 글을 SSR 할 때 `<link rel="canonical">` 은 허브 URL 로 출력 (SEO 중복 방지).
- `board_sites` 검증은 Route Handler 와 페이지 양쪽에서 일관 적용. middleware 만 믿지 않는다.

### 3.3 호스트 라우팅

- `src/middleware.ts` 에서 `request.headers.get('host')` 로 사이트를 판별, path 앞에 `/<site>` prefix 를 붙여 `rewrite`. (Next.js route group `()` 는 URL 영향이 없어 동일 path 충돌이 발생하므로, 일반 폴더 `hub`/`invest-note`/`today-alive` 사용. 직접 `/hub` 접근은 dev/우회용으로 허용.)
- `next.config.js` 의 `redirects()` 에서 `pixelwave.app` 의 일부 경로(예: `/`)에 대한 정책을 처리. (단, "허브"로 승격되므로 기존의 `/* → invest-note 301` 은 제거하거나 축소된다.)
- `/invite` UA 분기는 `app/(today-alive)/invite/route.ts` 에서 `request.headers.get('user-agent')` 보고 `Response.redirect(..., 302)`.

### 3.4 인증

- NextAuth (Auth.js) + GitHub Provider.
- 허용 GitHub ID 는 환경변수 화이트리스트 (`ADMIN_GITHUB_IDS=...`).
- `app/(hub)/admin/*` 은 미들웨어 또는 layout 에서 세션 검증, 미인증/비관리자는 404.
- 읽기 경로는 공개.

### 3.5 인프라

#### 서버 사양 (현재 Coolify 호스트)
- vCPU 2 / RAM 4GB (+swap) / NVMe 100GB / Ubuntu 24.04 LTS
- v1 워크로드(저트래픽 랜딩 + 소규모 게시판) 기준 **교체 없이 진행 가능**.

#### 메모리 예산

| 구성요소 | 정상 메모리 |
|---|---|
| Coolify (control plane + Traefik + sidecars) | ~700MB ~ 1GB |
| OS + Docker 데몬 | 300 ~ 500MB |
| Postgres (튜닝 시) | 300 ~ 500MB |
| Next.js (standalone, 저트래픽) | 200 ~ 400MB |
| **런타임 합계** | **~2.5GB (4GB 중 약 1.5GB 여유)** |

`next build` 는 단발성으로 1.5~2.5GB 를 점유 → **운영 박스에서 빌드하지 않는다.** §3.6 참조.

#### Next.js
- `output: 'standalone'`, Node 22+ Alpine 기반 Dockerfile.
- 런타임 환경변수 `NODE_OPTIONS=--max-old-space-size=1024` 로 메모리 캡.

#### Postgres (4GB 박스 튜닝)
- **공유 Postgres 인스턴스 1개**: 컨테이너 이름 `postgres-shared`, 향후 다른 프로젝트도 같은 인스턴스에 별도 DB/유저로 들어온다.
  - 이 마이그레이션용 DB/유저: `pixelwave` / `pixelwave`.
  - 인스턴스는 **외부 노출 OFF**, Coolify 내부 네트워크 한정.
  - 백업: **Cloudflare R2 daily 자동 백업**. 별도 버킷 `pixelwave-backups`, registry 토큰과 분리된 별도 R2 토큰(`pixelwave-backups-rw`). credential 은 **Coolify 의 글로벌 S3 Storages** 에 `pixelwave-r2-backups` 로 등록해 두고, Postgres 리소스의 Backups 탭이 이걸 참조한다 — postgres-shared env 에 R2 키가 노출되지 않는다. 백업은 인스턴스 단위.
- `postgresql.conf` 기준값 (공유 인스턴스 고려해 `max_connections` 상향):
  ```
  shared_buffers = 256MB
  effective_cache_size = 1GB
  work_mem = 8MB
  maintenance_work_mem = 64MB
  max_connections = 100
  ```
- 앱쪽 ORM 커넥션 풀은 앱당 5~10 으로 캡. 공유 인스턴스이므로 합산이 `max_connections` 의 절반을 넘기 시작하면 §3.7 업그레이드 트리거 재검토.

#### Storage
- 이미지 등은 Coolify persistent volume → Next.js 가 정적 서빙 (v1).
- 별도 마운트 권고: `/data/uploads`. 백업·볼륨 분리 용이.
- v1 디스크 사용량 예상: <5GB (100GB 중 충분 여유).

#### DNS / TLS
- Cloudflare DNS. Coolify Traefik 의 LE 자동 발급.
- CF 프록시는 cutover 시점에 결정 (off 또는 Origin Cert).

#### 도메인 매핑
- 동일 Coolify 앱에 3개 도메인을 모두 바인딩.

### 3.6 빌드 파이프라인

- **외부 CI 에서 Docker 이미지 빌드 → 자체 호스팅 registry(R2 백엔드) push → Coolify 가 pull.**
- 이유: 4GB 박스에서 `next build` 를 직접 돌리면 swap 으로 떨어져 5~10분 배포 + OOM 위험. 운영 박스의 CPU/RAM 은 런타임만 책임진다.
- **적용 범위**: 이 저장소(Next.js) 한정. 기존 FastAPI 프로젝트 2개는 Coolify 직접 빌드(메모리 압박 없음) 유지. registry 자체는 향후 다른 프로젝트가 공유 가능.

#### 구성

```
git push (main)
   ↓
GitHub Actions (외부 빌드)
   ↓ docker push registry.pixelwave.app/pixelwave-web:<sha>
[registry 컨테이너 on Coolify]  ←→  R2 bucket (실제 blob)
   ↑ docker pull
Coolify (deploy)
```

- **registry 컨테이너**: 공식 `registry:2` 이미지. Coolify 에 배포, 자체 도메인(`registry.pixelwave.app`) + Traefik LE TLS + htpasswd 기본 인증.
- **백엔드 스토리지**: Cloudflare R2 버킷(`pixelwave-registry`). registry 환경변수로 S3 호환 모드 설정.
- **결과**: Coolify 박스 디스크/메모리 부담 거의 0. R2 egress 무료. 10GB 무료 한도 안에서 사실상 비용 0.

#### registry 컨테이너 환경변수 (참고값)

```env
REGISTRY_STORAGE=s3
REGISTRY_STORAGE_S3_ACCESSKEY=<R2 access key>
REGISTRY_STORAGE_S3_SECRETKEY=<R2 secret key>
REGISTRY_STORAGE_S3_REGION=auto
REGISTRY_STORAGE_S3_BUCKET=pixelwave-registry
REGISTRY_STORAGE_S3_REGIONENDPOINT=https://<account-id>.r2.cloudflarestorage.com
REGISTRY_STORAGE_S3_FORCEPATHSTYLE=true
# R2 의 S3 API 가 multipart upload 의 part listing 일관성을 즉시 보장하지 않아
# registry:2 의 multipart upload 가 final PUT 단계에서 "Path not found" 로 실패한다.
# 단일 PUT 한도(100MB) 안에서 모든 layer 가 들어가도록 chunksize 를 100MB 로 설정한다.
REGISTRY_STORAGE_S3_CHUNKSIZE=104857600
REGISTRY_AUTH=htpasswd
REGISTRY_AUTH_HTPASSWD_REALM=Registry
REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd
```

### 3.7 사양 업그레이드 트리거

다음 중 하나라도 잡히면 4GB → 8GB 업그레이드를 발동:
- 같은 박스에 추가 앱을 1개 더 올린다.
- swap 이 상시 사용된다 (Coolify 메트릭 또는 `free -h`).
- Postgres 활성 연결수가 30 이상으로 정착.
- 게시판 트래픽이 일 10,000 PV 초과.

---

## 4. 단계별 진행 계획

> **원칙**: 정적 페이지 이식 → cutover → 그 다음 게시판 기능. 한꺼번에 하지 않는다.
> 각 Phase 는 **검증 기준**을 통과해야 다음으로 넘어간다.

### Phase 0. 사전 준비

**목표**: 작업 환경과 외부 자원을 준비.

작업:
- [x] Coolify 인스턴스 접근/네임스페이스 확인.
- [x] 호스트 swap **2GB 이상** 활성 확인 (`free -h`). 없으면 swapfile 생성. _→ 8GB 확보됨._
- [x] **공유 Postgres** 컨테이너 1개 프로비저닝 (`postgres-shared`), 이 앱용 DB/유저 `pixelwave` 생성.
  - ⚠️ **§3.5 튜닝값 적용·백업 활성화는 Phase 3 진입 전까지 follow-up.** 컨테이너만 뜬 상태이므로 스키마/실데이터 들어가기 전 반드시 마감.
- [x] Cloudflare R2 버킷 생성(`pixelwave-registry`), S3 호환 API 토큰 발급.
- [x] Coolify 에 `registry:2` 컨테이너 배포 — R2 백엔드 + htpasswd 인증 + `registry.pixelwave.app` 도메인/TLS. push/pull 왕복 검증 통과 (digest 일치).
- [x] registry push/pull 자격증명을 GitHub Actions secrets 와 Coolify 에 등록. (GHA: `production` environment, Coolify: 호스트 `/root/.docker/config.json`)
- [x] GitHub OAuth App 발급 (callback: `https://next.pixelwave.app/api/auth/callback/github`). client_id/secret 은 GHA `production` env + 후일 Coolify 앱 env 에 등록 예정.
- [x] 검증용 임시 도메인 `next.pixelwave.app` + `registry.pixelwave.app` DNS 레코드 준비 (158.247.208.173, Proxy OFF).

검증:
- `free -h` 에 swap 노출, 사용량 0 인 상태에서 시작.
- Postgres 가 Coolify 내부 네트워크로 접근 가능함을 확인 (외부 노출은 OFF).
- `docker push registry.pixelwave.app/test:hello` 및 `docker pull` 왕복 성공 (인증 포함).
- R2 버킷에 blob 파일이 생성된 것 확인.
- GitHub OAuth client id/secret 확보.

산출물: Coolify 프로젝트, Postgres 인스턴스, 자체 registry(R2 백엔드) + 자격증명, OAuth 자격증명.

---

### Phase 1. Next.js 골격 + 정적 페이지 이식

**목표**: 게시판 없이 현재 3개 사이트의 모든 정적 페이지를 Next.js 로 옮겨 `next.pixelwave.app` 으로 검증.

작업:
- [ ] `pnpm create next-app` 으로 골격 생성 (App Router, TypeScript, Tailwind 권장).
- [ ] `next.config.js` 에 `output: 'standalone'` 설정.
- [ ] `middleware.ts` 작성: host → route group 분기.
- [ ] route group 3개 생성: `(hub)`, `(invest-note)`, `(today-alive)`.
- [ ] 기존 `sites/*/index.html`, `privacy.html`, `terms.html`, `account-deletion.html` 을 각각 `app/(site)/<path>/page.tsx` (또는 MDX) 로 이식.
- [ ] `shared/styles/base.css` → 전역 스타일로 이전. `shared/partials/footer.html` → `<Footer />` 컴포넌트로.
- [ ] `today-alive/invite/route.ts` 작성: UA 검사 → 302 (기존 `_worker.js` 동작 동일).
- [x] `pixelwave.app` 의 기존 "전체 → invest-note 301" 정책 **Phase 3 까지 유지**. proxy.ts 가 `pixelwave.app` / `www.pixelwave.app` 호스트 path+query 보존하여 301. 검증용 `next.pixelwave.app` 은 redirect 제외(placeholder 노출).
- [ ] Dockerfile 작성 (Node 22+ Alpine, standalone 출력).
- [ ] GitHub Actions 빌드/푸시 워크플로 작성 → `registry.pixelwave.app/pixelwave-web:<sha>` 로 push.
- [x] Coolify 에 신규 앱 등록 (Docker Image 리소스, `registry.pixelwave.app/pixelwave-web:develop`), `next.pixelwave.app` 도메인 매핑, 배포 완료. 10건 외부 curl 검증 통과 (host→site 분기 / direct prefix / privacy/terms/account-deletion / /invite UA / .html redirect / TLS).

검증:
- `next.pixelwave.app/` 가 host 기반으로 hub 콘텐츠를 보여준다 (또는 임시 host override 로 invest-note/today-alive 도 확인 가능).
- `curl -A 'iPhone' https://next.pixelwave.app/invite` → App Store 302.
- `curl -A 'Mozilla' https://next.pixelwave.app/invite` → Play Store 302.
- 각 사이트의 privacy/terms 등 모든 경로가 정상 렌더.
- Lighthouse 또는 시각 확인으로 디자인이 기존 정적 사이트와 동등.

산출물: 동작하는 Next.js 앱 (게시판 없음), Coolify 에 배포된 `next.pixelwave.app`.

---

### Phase 2. DNS Cutover

**목표**: 3개 운영 도메인을 Cloudflare Workers → Coolify 로 전환.

작업:
- [x] Coolify 앱에 운영 도메인 (today-alive·invest-note·pixelwave.app·www.pixelwave.app) 추가, Traefik LE 발급 확인.
- [x] Cloudflare DNS 레코드 변경: 각 도메인의 CF Workers/Pages Custom Domain 해제 후 A(또는 apex→www CNAME) 158.247.208.173, **Proxy OFF (gray cloud)**.
- [x] CF 프록시는 **OFF 로 시작** 결정. 안정화 후 ON 검토 (Phase 4 이후).
- [ ] 기존 CF Worker/Pages 는 즉시 삭제하지 않고 **1주일 보존** (rollback 안전망). Phase 5 정리에서 제거.

검증:
- ✅ 3개 운영 도메인 + www 모두 HTTP/2 200(또는 301), TLS 유효.
- ✅ today-alive `/invite` UA 분기 iOS→App Store / Android→Play Store / 빈 UA→Play Store.
- ✅ privacy / terms / account-deletion / .html → 깨끗 URL 308 같은 host 보존.
- ✅ apex+www → invest-note 301 path+query 보존, http→https 302 force.
- ⏳ 404/500 로그 모니터링 24시간 (Task #19).

산출물: 운영 도메인의 Next.js/Coolify 전환 완료.

---

### Phase 3. 데이터 모델 + 인증 + 어드민 (게시판 없는 상태에서)

**목표**: 게시판 UI 를 짓기 전에 DB 연결과 어드민 인증을 먼저 굳힌다.

작업:
- [x] Drizzle ORM 도입, Postgres 연결 (lazy `getDb()` 패턴, src/db/index.ts).
- [x] 스키마 작성: `sites`, `boards`, `board_sites`, `posts`, `users` (src/db/schema.ts).
- [x] 초기 마이그레이션 실행 (src/db/migrations/0000_*.sql), `sites` 시드 (`hub`, `invest-note`, `today-alive`).
- [x] NextAuth v5 설정 (src/auth.ts), GitHub Provider, 관리자 ADMIN_GITHUB_IDS 화이트리스트.
- [x] `src/app/hub/admin/page.tsx` + `layout.tsx` (인증 가드) + `src/app/hub/login/page.tsx`. proxy.ts 의 hub redirect 가 /admin · /login 은 hub site 로 rewrite (HUB_NONREDIRECT_PREFIXES).

검증:
- ✅ 관리자(`github_id=5800336`) GitHub 로그인 → `/admin` 진입 운영(`https://pixelwave.app/admin`) 확인.
- ✅ 비로그인 → `/admin` → `/login` 307 redirect (docs 의 "404" 기준에서 redirect 로 변경 — UX 측면).
- ✅ DB 마이그레이션 idempotent (drizzle-kit migrate 의 journal 기반).
- ✅ NextAuth providers callback URL = `https://pixelwave.app/api/auth/callback/github`.

산출물: 인증된 어드민 라우트, 마이그레이션된 DB.

---

### Phase 4. 게시판 v1 (읽기 + 작성)

**목표**: 멀티 보드 CRUD 의 최소 기능을 운영.

작업:
- [x] `/admin` 에 보드 생성/편집 UI (slug, title, owner_site, 노출 사이트 체크박스). server action.
- [x] `/admin` 에 글 작성/편집 UI (markdown textarea + 공개 토글). server action.
- [x] 공개 라우트:
  - `pixelwave.app/b/[board]` → 글 목록 (publishedAt 비null, desc 정렬)
  - `pixelwave.app/b/[board]/[post]` → 글 상세 (정본 URL)
  - `<sub>.pixelwave.app/b/[board]` 및 `/[post]` → `board_sites` inner join 으로 화이트리스트 검사. 통과 시 SSR, canonical 은 항상 허브 URL.
- [x] markdown 렌더 시 sanitize — `rehype-sanitize` (unified pipeline).
- [ ] 허브 랜딩 placeholder 그대로 (사용자 결정: hub redirect 유지). 4.5 skip.

검증:
- 보드 2~3개 생성, 각각 `owner_site` 다르게 설정.
- 동일 글이 허브와 owner 사이트에서 SSR 되고, 허용 안 된 사이트에서는 404.
- canonical 메타가 정확히 허브 URL.
- markdown XSS 시도(예: `<script>` 포함 본문)가 렌더 시 무력화됨.
- 미인증 사용자가 작성 API 호출 시 403/404.

산출물: 동작하는 멀티 보드 v1.

---

### Phase 5. 정리

**목표**: 운영 자산 정리 및 후속 작업 큐 정의.

작업:
- [ ] 기존 CF Worker/Pages 프로젝트 삭제 (콘솔, 사용자 작업). 운영 인입은 이미 Coolify 로 전환됨.
- [x] `sites/*/wrangler.jsonc`, `_worker.js`, `_redirects`, `.assetsignore` 등 CF 전용 파일 + `sites/` `shared/` 디렉토리 + `docs/legacy-readme.md` 통째 제거.
- [x] `README.md` 갱신 (CF 기반 설명 → Coolify/Next.js 기반 + 로컬 dev 가이드).
- [x] 본 문서(`docs/migration-plan.md`)를 회고/사후 기록으로 마감 (§7 추가). 별도 architecture.md 분리는 안 함 — README 의 "운영 인프라" 섹션 + 본 문서로 충분.

검증:
- ✅ 저장소 내 Cloudflare 관련 잔존 파일 없음.
- ✅ 새 기여자가 README 만 보고 로컬 실행과 배포 흐름을 이해 가능.

산출물: 정리된 저장소 + 마감된 회고 문서.

---

## 5. 리스크 & 결정 보류 항목

| 항목 | 내용 | 상태 |
|---|---|---|
| CF 프록시 유지 여부 | 캐싱·DDoS 보호 vs 단순성 | ✅ Phase 2 cutover 시 OFF(gray cloud) 결정 |
| 이미지 업로드 외부화 | 트래픽/용량 임계 도달 시 R2/S3 | 보류 (v1 이후) |
| 댓글 기능 | moderation 부담 큼 | 보류 (v1 이후) |
| 다중 작성자 | NextAuth role 확장 필요 | 보류 (필요 시점) |
| ISR/캐싱 정책 | SSR 응답 캐시 헤더 설계 | ✅ Phase 4 의 /b 라우트에 `revalidate=60` 적용 |
| Postgres 백업 활성 | R2 `pixelwave-backups` + Coolify 글로벌 S3 Storage `pixelwave-r2-backups` 연결 daily | ✅ 완료 |
| Postgres 튜닝값 적용 | §3.5 postgresql.conf (max_connections=100 등) | 보류 — 사용자 결정 (Task #21, 필요시) |
| 백업 복구 리허설 | Postgres dump 복원 테스트 | 보류 — Phase 3 직후 였으나 미실행, 필요시 진행 |
| SEO 정본 URL 위반 | canonical 누락 시 중복 색인 | ✅ Phase 4 의 모든 /b 페이지가 `alternates.canonical = hub URL` 출력 |
| Coolify image pull 캐시 | `:main` mutable tag 가 갱신 후 cached 그대로 사용 | 운영: 매 release 마다 immutable sha 태그로 박는 흐름. 향후 webhook 자동화 검토 |
| hub 랜딩 교체 (Phase 4.5) | invest-note 301 → "최근 글" 인덱스 | 보류 — 사용자 결정으로 redirect 유지 |

---

## 6. 변경 이력

- 2026-05-28: 초안 작성. Phase 0~5 정의.
- 2026-05-28: §3.5 인프라 확장(서버 사양·메모리 예산·Postgres 튜닝·업그레이드 트리거), §3.6 빌드 파이프라인(CI 빌드 + GHCR pull) 추가. Phase 0·1 작업 항목 반영.
- 2026-05-28: §3.6 레지스트리를 GHCR → 자체 호스팅 `registry:2` + Cloudflare R2 백엔드로 변경. Phase 0 에 R2/registry 컨테이너 구축 단계 추가, Phase 1 의 push 대상 갱신. 적용 범위가 Next.js 한정임을 명시(FastAPI 2개는 Coolify 직접 빌드 유지).
- 2026-05-28: Postgres 를 **공유 인스턴스(`postgres-shared`)** 로 변경. 앱별 분리 DB/유저(`pixelwave`), `max_connections` 50→100. Phase 0 swap/Coolify 접근/Postgres 항목 완료 처리.
- 2026-05-28: **Phase 0 완료.** registry:2(R2 백엔드) + htpasswd + Traefik LE 가동, push/pull 왕복 digest 일치 검증. GHA `production` env 와 호스트 docker config 에 자격증명 등록. GitHub OAuth App 발급 (callback: `next.pixelwave.app`). DNS `next`/`registry.pixelwave.app` → 158.247.208.173 (Proxy OFF). Postgres 튜닝/백업은 Phase 3 전 마감으로 후속.
- 2026-05-28: Postgres 백업 destination 을 **Cloudflare R2 (`pixelwave-backups` 버킷, 별도 토큰)** 로 결정. registry 와 권한 분리.
- 2026-05-28: **Phase 1.1 완료.** Next.js 16.2.6 + React 19 + Tailwind v4 + ESLint scaffold 이식. `output: 'standalone'`, package name `pixelwave-web`. `pnpm dev` (PORT=3100) Ready 746ms, `<title>Create Next App</title>` 렌더 + Tailwind 출력 확인. 기존 `README.md` → `docs/legacy-readme.md` 로 보존. `memo.txt` 는 .gitignore 추가(로컬 메모, 시크릿 포함).
- 2026-05-28: 폴더 구조를 `src/app` 으로 이행. tsconfig `@/*` → `./src/*`. dev 가 `pnpm dev` 만으로 :3100 바인딩되도록 script 고정.
- 2026-05-28: **Phase 1.2 완료.** `src/proxy.ts` (Next.js 16 의 `middleware` → `proxy` 새 컨벤션, named export `proxy`) 에서 host 기반 prefix rewrite. `src/app/{hub,invest-note,today-alive}/page.tsx` placeholder, `src/app/page.tsx` 제거. `shared/styles/base.css` → `src/app/globals.css` 머지 (Tailwind v4 와 공존). `src/components/Footer.tsx` 작성 (props: siteName/privacyHref/termsHref/supportEmail). 8개 호스트/직접경로 시나리오 curl 검증 통과. ⚠️ docs §3.1 의 route group `()` 표기는 잘못된 가정이라 일반 폴더로 정정.
- 2026-05-28: **Phase 1.3 완료.** today-alive 정적 3 페이지(index/privacy/terms) 이식 + `/invite` UA 분기 route handler (iOS/Android/빈 UA 분기 302). `next.config.ts` 에 `.html` → 깨끗 URL permanent redirect(`privacy|terms|account-deletion`). `Footer` 를 `links` 배열 받는 형태로 일반화 — page 별로 다른 nav (landing: privacy+terms / privacy+terms 서브: 홈+상대). 8건 curl (4 페이지 + 3 UA + 2 .html) 모두 통과.
- 2026-05-28: **Phase 1.4 완료.** invest-note 정적 4 페이지(index/privacy/terms/account-deletion) 이식. account-deletion 의 mailto 는 기존 URL-encoded subject(`[투자노트] 계정 삭제 요청`) 그대로 보존. 4 페이지 + 3 .html → 깨끗 URL redirect 검증 통과.
- 2026-05-28: **Phase 1.5 완료.** proxy.ts 에 `pixelwave.app`/`www.pixelwave.app` → `https://invest-note.pixelwave.app{path}{search}` 301 추가 (Phase 3 진짜 hub 생기기 전까지 유지, 검증용 `next.pixelwave.app` 은 제외). 6가지 시나리오 curl 통과.
- 2026-05-28: **Phase 1.6 완료.** Multi-stage Dockerfile (node:22-alpine, deps/builder/runner) + standalone 출력 사용. NODE_OPTIONS=--max-old-space-size=1024, non-root nextjs 유저, PORT=3000. `.dockerignore` 로 docs/sites/shared/memo.txt/README/.git 제외. 빌드: 76.5MB (compressed) / 306MB (uncompressed), arch=amd64 (Coolify 호스트 호환). 컨테이너 실행 후 host 위조 + UA 분기 + .html redirect 전부 dev 와 동일 동작 확인.
- 2026-05-28: **Phase 1.7 작성 완료.** `.github/workflows/build.yml` — main/develop push 트리거, `environment: production` 의 REGISTRY_URL/USERNAME/PASSWORD secrets 사용, buildx 로 linux/amd64 빌드 후 `registry.pixelwave.app/pixelwave-web:<short-sha>` 와 `:<branch>` 태그로 push. gha cache(`type=gha,mode=max`). 실제 트리거는 GitHub 푸시 후 검증 필요(미push).
- 2026-05-28: GHA push 실패 → 두 단계 fix. (1) provenance/sbom 끔 — buildx attestation manifest 가 registry:2 와 비호환. (2) `outputs: type=registry,oci-mediatypes=false` — docker schema2 단일 manifest 강제. (3) **결정적 fix**: registry 측 `REGISTRY_STORAGE_S3_CHUNKSIZE=104857600` (100MB) 추가. node 베이스 layer 가 default chunksize(10MB) 초과해 multipart upload 사용 시 R2 의 part listing 즉시 일관성 미보장으로 "s3aws: Path not found" 발생 → chunksize 키워 single-part 강제로 해결.
- 2026-05-28: **Phase 1.8 완료. Phase 1 종료.** Coolify 의 `pixelwave-web` 프로젝트에 Docker Image 리소스로 `registry.pixelwave.app/pixelwave-web:develop` 등록, port 3000 노출, `next.pixelwave.app` 도메인 매핑, NODE_ENV/NEXT_TELEMETRY_DISABLED env 만 명시. Traefik LE 발급 통과, HTTP/2 200. 외부 curl 10건(host→site / 직접 prefix / privacy/terms/account-deletion / /invite UA iOS·Android / .html redirect) 전부 통과. 운영 도메인(pixelwave.app·invest-note·today-alive) host 매핑 검증은 Phase 2 cutover 후에만 가능.
- 2026-05-28: **Phase 2 (DNS cutover) 통신 검증 통과.** today-alive → invest-note → hub(apex+www) 순서로 cutover. 각 도메인마다 (1) Coolify Domains 매핑 (2) CF Workers/Pages Custom Domain 해제 (3) CF DNS A/CNAME 으로 158.247.208.173·Proxy OFF (4) Traefik LE 발급 (5) 외부 curl 검증. today-alive 7건/invest-note 8건/hub 7건 통과. mailto subject 인코딩·canonical link·http→https force·301 path+query 보존 모두 확인. CF 잔재(Worker/Pages/cloudflare branches)는 1주일 후 Phase 5 에서 정리. 24시간 운영 모니터링 진행 중(Task #19).
- 2026-05-28: **24h 운영 모니터링 skip 결정.** 외부 22건 curl 검증으로 통신 정합성 확인됨. Task #19 closed.
- 2026-05-28: **Phase 5 정리 1차 진행.** `sites/`(hub/invest-note/today-alive 정적 + wrangler/_worker/_redirects/.assetsignore), `shared/`(base.css·footer.html), `docs/legacy-readme.md` git 에서 제거. `README.md` 를 Coolify/Next.js 운영 가이드로 새로 작성. `.gitignore` 의 legacy CF artifacts 라인 제거. scaffold 동봉 `public/*.svg` 5개 제거. CF Workers/Pages 콘솔에서 프로젝트 자체 삭제는 사용자 작업으로 남음.
- 2026-05-28: **Postgres 백업 활성.** Coolify 의 글로벌 S3 Storages 에 `pixelwave-r2-backups` (R2 `pixelwave-backups` 버킷) 등록 후 `postgres-shared` Backups 탭이 이를 참조. credential 중앙 관리. 튜닝값은 사용자 결정으로 보류 → Task #21.
- 2026-05-28: **CF DNS 운영 도메인 A → CNAME 전환 완료** (apex `pixelwave.app` 만 A `158.247.208.173` 유지, 서브도메인은 CNAME → apex). 호스트 IP 변경 시 단일 갱신점.
- 2026-05-28: **`api.invest-note.pixelwave.app` TLS 미커버 해소** (사용자 측 처리). 마이그레이션 범위 외 백엔드 도메인.
- 2026-05-28: **staging 사용 안 함 결정.** `next.pixelwave.app` 도메인 폐기. `proxy.ts` 의 SITE_BY_HOST 에서 매핑 제거. 후속 사용자 작업: Coolify pixelwave-web 앱 Domains 에서 next.pixelwave.app 제거 / CF DNS 의 `next` 레코드 제거 / GitHub OAuth App callback URL 을 운영 도메인으로 변경 (Phase 3 NextAuth 셋업 시 처리). develop staging 없이 로컬 dev → main 머지 → 운영 배포 흐름으로 운영.
- 2026-05-29: **Phase 3.1~3.4 코드 완료** (Drizzle ORM + 스키마 5종 + 첫 마이그레이션 + sites 시드 + NextAuth v5 + GitHub provider + ADMIN_GITHUB_IDS 화이트리스트 + admin/login 페이지 + 인증 가드 + proxy 의 hub redirect 예외 /admin·/login).
- 2026-05-29: **로컬 dev 환경 검증 통과.** docker postgres:17-alpine → pnpm db:migrate(5 테이블) → pnpm db:seed(sites 3행) → pnpm dev → /login 200 / /admin → /login 307 / NextAuth providers·csrf 200 / 정적 페이지 회귀 없음. 브라우저 GitHub OAuth(dev App) 통과 + admin 진입 확인. dotenv 로 drizzle-kit·seed 가 .env.local 자동 로드.
- 2026-05-29: **Phase 3.5 운영 셋업 완료. Phase 3 종료.** release/v0.1.4 머지(main HEAD `beabc9e`). 운영 OAuth App callback 을 `https://pixelwave.app/api/auth/callback/github` 로 변경. Coolify env vars 7개(DATABASE_URL/AUTH_SECRET/AUTH_URL/AUTH_TRUST_HOST/GITHUB_CLIENT_*/ADMIN_GITHUB_IDS) 추가 + Redeploy. postgres-shared Terminal 에서 0000_*.sql 적용 + sites 시드. 외부 curl 6건 통과(/login 200·/admin 307·csrf 200·providers callback URL 정확·apex 301·www /login 200). 브라우저 운영 GitHub OAuth flow 통과 + admin 진입 확인. ⚠️ Coolify image pull 캐시 이슈 — `:main` mutable tag 가 갱신 후 cached 그대로 사용. **immutable sha 태그(`beabc9e`)** 로 박아 우회.
- 2026-05-29: **hub redirect 유지 결정.** Phase 4.5(hub 랜딩 교체) 미진행. `pixelwave.app/*` → invest-note 301 그대로. proxy 의 HUB_NONREDIRECT_PREFIXES 에 `/b` 추가하여 게시판 정본 URL(`pixelwave.app/b/...`) 만 hub site 로 rewrite.
- 2026-05-29: **Phase 4.1 완료.** admin 보드 CRUD 4 파일 + actions.ts. server action 으로 보드 생성/수정/삭제, board_sites 재구성 시 owner_site 자동 포함. 슬러그 형식 검증(`/^[a-z0-9]+(-[a-z0-9]+)*$/`). 로컬 dev 6건 curl 통과(가드 307·hub host /b 예외·회귀).
- 2026-05-29: **Phase 4.2 완료.** admin 글 CRUD 4 파일 + actions.ts. src/lib/markdown.ts 에 unified(remark-parse → remark-rehype → rehype-sanitize → rehype-stringify) 파이프라인. `<script>alert(1)</script>` 가 단순 텍스트로 무력화 sanity 확인. publishedAt 토글로 공개/비공개.
- 2026-05-29: **Phase 4.3 완료.** hub 의 공개 라우트 src/app/hub/b/[board]/page.tsx (목록 — publishedAt 비null 만, desc 정렬) + [board]/[post]/page.tsx (상세 — mdToSafeHtml + dangerouslySetInnerHTML 안전). canonical = hub URL. revalidate=60. dev curl: 없는 board/post 모두 404, 회귀 invest-note 200.
- 2026-05-29: **Phase 4.4 완료. Phase 4 코드 종료.** src/lib/board-post.ts 의 site-aware loader 가 board_sites 와 inner join 으로 화이트리스트 동시 검사. invest-note·today-alive 각각 b/[board]/page.tsx + [post]/page.tsx (4 파일). canonical 메타는 모든 site 에서 동일하게 hub URL 출력. dev: 없는 board/post 모두 404, 회귀(랜딩·/invite) 통과. 실제 노출 검증(brower, 보드 2개·exposure sites 분리 설정)은 사용자 manual.
- 2026-05-29: **Phase 5 마감.** 본 문서를 회고 형태로 종료(§7 추가), §5 보류 항목 상태 갱신, §4 Phase 5 체크박스 정리. CF Workers/Pages 콘솔 프로젝트 자체 삭제만 사용자 외부 작업으로 남음. 운영 자료는 README + 본 문서로 충분 — 별도 architecture.md 미작성.

---

## 7. 마이그레이션 종료 회고

**완료일**: 2026-05-29

### 인입 흐름 (운영)

```
사용자 브라우저
   ↓ HTTPS (CF DNS, Proxy OFF, A/CNAME → 158.247.208.173)
Coolify Traefik (LE 자동 발급, 4 도메인 매핑)
   ↓
pixelwave-web (Next.js standalone 컨테이너)
   ↓ src/proxy.ts host → site prefix rewrite
[hub] / [invest-note] / [today-alive] route group
   ↓ DB 접근만 server component / server action
postgres-shared (공유 Postgres, 외부 노출 OFF)
   ↓ daily dump
Coolify 글로벌 S3 Storage `pixelwave-r2-backups`
   ↓
Cloudflare R2 `pixelwave-backups`
```

### 빌드/배포 흐름

```
git push main
   ↓
GitHub Actions (.github/workflows/build.yml — provenance:false, oci-mediatypes:false)
   ↓
registry.pixelwave.app/pixelwave-web:<short-sha> + :main
   ↑ Cloudflare R2 `pixelwave-registry` (REGISTRY_STORAGE_S3_CHUNKSIZE=104857600 으로 multipart 회피)
   ↓
Coolify (Image Tag = sha 명시) → docker pull → 컨테이너 재기동
```

### 운영 도메인

| 호스트 | 동작 |
|---|---|
| `pixelwave.app`, `www.pixelwave.app` | hub redirect → invest-note 301 (정본 path 만 `/admin`·`/login`·`/b` 예외 → hub site rewrite) |
| `invest-note.pixelwave.app` | 정적 랜딩 + privacy/terms/account-deletion + `/b/...`(화이트리스트) |
| `today-alive.pixelwave.app` | 정적 랜딩 + privacy/terms + `/invite` UA 분기 + `/b/...`(화이트리스트) |

### 회고 요약 — 함정 모음

1. **Next.js 16 의 `middleware` → `proxy` rename**: deprecation 경고 후 file/named export 둘 다 정정. AGENTS.md 의 사전 경고가 적중.
2. **registry:2 + R2 multipart 비호환**: 큰 layer 가 multipart upload 로 분할되면 R2 의 part listing 일관성 미보장으로 "s3aws: Path not found". `CHUNKSIZE=104857600` 으로 single-part 강제 회피.
3. **buildx attestation manifest 비호환**: provenance/sbom + OCI mediatypes 모두 끔.
4. **Coolify image pull 캐시**: `:main` 갱신 후에도 cached 그대로 사용. immutable sha 태그로 박아 우회.
5. **Universal SSL 의 2단계 도메인 미커버**: `api.invest-note.pixelwave.app` 의 인증서 사라짐. ACM 또는 origin 자체 TLS 로 해결 (마이그레이션 범위 외, 사용자 처리).
6. **hub redirect 가 server action callback 까지 가로채는 위험**: HUB_NONREDIRECT_PREFIXES(`/admin`/`/login`/`/b`) 로 정본 path 만 우회.

### 미완료/후속

- CF Workers/Pages 프로젝트 자체 삭제 (사용자 콘솔 작업)
- Postgres 튜닝값 적용 (Task #21, 필요시)
- 백업 복구 리허설 (필요시)
- hub 랜딩 교체 (Phase 4.5, 미진행 결정)
- 이미지 업로드 외부화, 댓글, 다중 작성자 (v1 이후)
