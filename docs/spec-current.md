# Pixelwave 현재 시스템 사양

> 운영 시점 기준 단일 source-of-truth. 다음 release/v0.1.5 까지 Phase 4 코드(게시판 v1) 가 `develop` 에만 있고 운영에는 미적용. 그 외 모든 항목은 운영 인입 가능 상태.

## 1. 도메인 매핑

| 호스트 | 동작 |
|---|---|
| `pixelwave.app`, `www.pixelwave.app` | hub site. 단 `/admin`·`/login`·`/b` 정본 path 외에는 invest-note 로 301 redirect (임시) |
| `invest-note.pixelwave.app` | 정적 랜딩 + privacy / terms / account-deletion + `/b/[board]/[post]` (board_sites 화이트리스트) |
| `today-alive.pixelwave.app` | 정적 랜딩 + privacy / terms + `/invite` UA 분기 + `/b/[board]/[post]` (board_sites 화이트리스트) |
| `api.invest-note.pixelwave.app` | 마이그레이션 범위 외 (별도 FastAPI 백엔드) |

DNS: Cloudflare zone `pixelwave.app`. apex 만 A `158.247.208.173`, 서브는 모두 CNAME → apex. **Proxy OFF (gray cloud)**.

## 2. 인입 흐름

```
사용자 브라우저
  │  HTTPS
  ▼
Cloudflare DNS (Proxy OFF)
  │
  ▼
Coolify Traefik  (Let's Encrypt 자동 발급)
  │
  ▼
pixelwave-web (Next.js 16 standalone 컨테이너, node:22-alpine)
  │
  │  src/proxy.ts — host 헤더로 site 판별 후 path 앞에 /<site> prefix rewrite
  │  (Next.js 16 의 middleware → proxy 새 컨벤션)
  ▼
src/app/{hub|invest-note|today-alive}/...
  │  server component / server action 만 DB 접근
  ▼
postgres-shared (Coolify Postgres 17, 외부 노출 OFF)
```

### proxy 분기 규칙

- 알려진 운영 host → site 매핑 (`SITE_BY_HOST`)
- `pixelwave.app` / `www.pixelwave.app` 의 hub redirect 는 `HUB_NONREDIRECT_PREFIXES = ['/admin', '/login', '/b']` 만 hub site 로 rewrite, 나머지는 `https://invest-note.pixelwave.app{path}{search}` 로 301
- 알 수 없는 host → hub fallback
- matcher 가 `_next/`·`api/`·`favicon.ico`·확장자 있는 정적 경로는 proxy 자체를 건너뜀

## 3. Next.js 라우트

```
src/
  proxy.ts                                  host → site rewrite
  app/
    layout.tsx, globals.css                 root layout
    api/auth/[...nextauth]/route.ts         NextAuth 핸들러
    hub/                                    pixelwave.app
      page.tsx                              placeholder (hub redirect 가 가로채므로 실 노출 X)
      login/page.tsx                        signIn('github') 폼
      admin/                                NextAuth 가드 layout + 페이지들
        layout.tsx, page.tsx
        boards/page.tsx, new/page.tsx, [slug]/page.tsx, actions.ts
        boards/[slug]/posts/page.tsx, new/page.tsx, [postSlug]/page.tsx, actions.ts
      b/[board]/page.tsx, [post]/page.tsx   공개 게시판 (정본 URL)
    invest-note/
      page.tsx, privacy/, terms/, account-deletion/
      b/[board]/page.tsx, [post]/page.tsx   화이트리스트 통과 시 SSR
    today-alive/
      page.tsx, privacy/, terms/
      invite/route.ts                       iOS → App Store / 그 외 → Play Store 302
      b/[board]/page.tsx, [post]/page.tsx   화이트리스트 통과 시 SSR
  components/Footer.tsx
  db/index.ts, schema.ts, seed.ts, migrations/
  lib/markdown.ts                           unified → remark → rehype-sanitize → HTML
  lib/board-post.ts                         site-aware loader (board_sites inner join)
  types/next-auth.d.ts                      Session augmentation (githubId)
```

### .html 호환 redirect

`next.config.ts` 의 `redirects()` 가 `/<slug>.html` → `/<slug>` 308 (slug: `privacy|terms|account-deletion`).

## 4. 데이터 모델

```
sites        (slug PK)                                — ['hub','invest-note','today-alive'] 시드
boards       (id PK, slug UNIQUE, title, owner_site FK→sites.slug, is_public, created_at)
board_sites  (board_id, site_slug) composite PK       — owner_site 자동 포함, M:N 노출 허용
posts        (id PK, board_id FK, slug, title, body_md, published_at?, updated_at)
             UNIQUE(board_id, slug)
users        (id PK, github_id UNIQUE, role default 'admin', created_at)
```

- 정본 URL = `https://pixelwave.app/b/<board>/<post>`. 모든 site 의 `/b/...` 페이지가 `<link rel="canonical">` 을 이 URL 로 출력.
- 공개 라우트는 `posts.published_at IS NOT NULL` + `boards.is_public = true` + `board_sites` 화이트리스트 통과만 노출.
- 마이그레이션: `src/db/migrations/0000_*.sql` (drizzle-kit journal 기반 idempotent).

## 5. 인증

NextAuth v5 + GitHub provider + JWT session.

```
/login form  →  signIn('github', redirectTo: '/admin')
              ↓
GitHub OAuth (callback https://pixelwave.app/api/auth/callback/github)
              ↓
src/auth.ts 의 signIn 콜백:
  ADMIN_GITHUB_IDS(쉼표 구분 numeric id) 화이트리스트 통과 시만 true
              ↓
JWT 발급. session.user.githubId 저장.
              ↓
/admin/* layout 가드: auth() === null → /login 으로 redirect
```

## 6. 빌드/배포

```
git push main
  ↓
GitHub Actions (.github/workflows/build.yml)
  buildx · linux/amd64
  provenance:false, sbom:false, outputs=type=registry,oci-mediatypes=false
  (registry:2 호환 + R2 multipart 회피)
  ↓
registry.pixelwave.app/pixelwave-web:<short-sha> + :main
  ▲ registry:2 컨테이너 (htpasswd 인증, R2 백엔드)
  │ Cloudflare R2 `pixelwave-registry`
  │ REGISTRY_STORAGE_S3_CHUNKSIZE=104857600 (multipart 회피)
  ↓
Coolify (Image Tag = sha 명시) → docker pull → 컨테이너 재기동
```

### 운영 자원

| 카테고리 | 자원 | 역할 |
|---|---|---|
| **DNS** | Cloudflare `pixelwave.app` zone | apex A + 서브 CNAME, Proxy OFF |
| **호스트** | Coolify 박스 158.247.208.173 (vCPU 2 / RAM 4GB / swap 8GB / NVMe 100GB) | Traefik + 모든 컨테이너 |
| **앱** | `pixelwave-web` (Next.js standalone) | 4 호스트 단일 컨테이너 처리. PORT=3000, `NODE_OPTIONS=--max-old-space-size=1024` |
| **DB** | `postgres-shared` (PG 17, 공유 인스턴스) | DB/유저 `pixelwave`. 외부 노출 OFF |
| **레지스트리** | `registry:2` 컨테이너 + R2 `pixelwave-registry` | 자체 호스팅 이미지 저장 |
| **백업** | Coolify 글로벌 S3 Storage `pixelwave-r2-backups` → R2 `pixelwave-backups` | Postgres daily dump, 14일 retention |
| **CI** | GitHub Actions, `production` environment | 빌드 + registry push |
| **인증** | GitHub OAuth + NextAuth v5 JWT | admin 1명 화이트리스트 |

## 7. 시크릿 분포

| 위치 | 키 |
|---|---|
| GHA `production` env | `REGISTRY_URL` / `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` |
| Coolify 호스트 `/root/.docker/config.json` | registry pull 자격증명 |
| Coolify pixelwave-web 앱 env | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_IDS`, `NODE_ENV`, `NEXT_TELEMETRY_DISABLED` |
| Coolify 글로벌 S3 Storage `pixelwave-r2-backups` | R2 백업 토큰 (Object R/W, `pixelwave-backups` 한정) |
| registry:2 env | R2 토큰 (`pixelwave-registry` 한정), htpasswd 파일, `REGISTRY_HTTP_SECRET` |
| GitHub OAuth App (운영) | client_id / secret (callback: `https://pixelwave.app/api/auth/callback/github`) |
| GitHub OAuth App (dev) | client_id / secret (callback: `http://localhost:3100/api/auth/callback/github`) |
| 로컬 `.env.local` (git ignore) | 위 dev 자격증명 + dev `DATABASE_URL=postgresql://pixelwave:devpw@localhost:5432/pixelwave` |

## 8. 로컬 dev 흐름

```bash
docker run -d --name pixelwave-dev-pg \
  -p 5432:5432 -e POSTGRES_USER=pixelwave -e POSTGRES_PASSWORD=devpw \
  -e POSTGRES_DB=pixelwave postgres:17-alpine

cp .env.example .env.local      # 값 채우기 (dev OAuth App, AUTH_SECRET 등)

pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev                        # http://localhost:3100/
```

drizzle-kit 와 seed 스크립트는 `dotenv` 로 `.env.local` 자동 로드 (운영은 Coolify env inject).
