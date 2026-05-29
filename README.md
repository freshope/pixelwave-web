# pixelwave-web

Pixelwave 산하 사이트들의 통합 Next.js 앱. host 헤더 기반으로 한 컨테이너에서 사이트별 라우팅을 분기 서빙한다.

## 도메인 매핑

| 도메인 | 라우팅 |
|---|---|
| `pixelwave.app`, `www.pixelwave.app` | `invest-note.pixelwave.app` 로 301 (임시 — Phase 3 의 진짜 hub 등장 전까지) |
| `invest-note.pixelwave.app` | `src/app/invest-note/*` (랜딩 + privacy / terms / account-deletion) |
| `today-alive.pixelwave.app` | `src/app/today-alive/*` (랜딩 + privacy / terms + `/invite` UA 분기) |

`src/proxy.ts` 가 host 헤더로 site 를 판별, path 앞에 `/<site>` prefix 를 붙여 rewrite (Next.js 16 의 `middleware` → `proxy` 컨벤션). 매핑 안 된 host(예: localhost) 는 hub 로 fallback.

## 로컬 개발

의존성 + 로컬 Postgres + env:

```bash
pnpm install

docker run -d --name pixelwave-dev-pg \
  -p 5432:5432 \
  -e POSTGRES_USER=pixelwave \
  -e POSTGRES_PASSWORD=devpw \
  -e POSTGRES_DB=pixelwave \
  postgres:17-alpine

cp .env.example .env.local      # 값 채우기 (DATABASE_URL 외 GitHub OAuth dev App 발급분 등)

pnpm db:migrate                 # 스키마 적용
pnpm db:seed                    # sites 3행 시드
pnpm dev                        # http://localhost:3100/
```

host 별 라우팅 검증:

```bash
curl -H 'Host: invest-note.pixelwave.app' http://localhost:3100/
curl -H 'Host: today-alive.pixelwave.app' -A 'iPhone' http://localhost:3100/invite
```

## 배포 흐름

```
git push (main|develop 브랜치  또는  v* 태그)
  ↓
GitHub Actions  (.github/workflows/build.yml)
  ↓ docker buildx (linux/amd64, OCI manifest off)
registry.pixelwave.app/pixelwave-web:<short-sha>  +  :<ref>
  · 브랜치 push → :<short-sha> + :main|:develop
  · v* 태그 push → :<short-sha> + :v1.2.3 + :latest
  ↓ docker pull
Coolify (pixelwave-web 프로젝트) → Traefik LE → 4개 도메인
```

현재 사양은 [`docs/spec-current.md`](docs/spec-current.md), 결정 기록은 [`docs/decisions.md`](docs/decisions.md), 향후 계획은 [`docs/roadmap.md`](docs/roadmap.md), 보류 작업은 [`docs/backlog.md`](docs/backlog.md).

## 디렉토리 구조

```
src/
  proxy.ts                  # host → site prefix rewrite
  app/
    layout.tsx, globals.css
    hub/                    # pixelwave.app placeholder
    invest-note/            # invest-note.pixelwave.app
    today-alive/            # today-alive.pixelwave.app
      invite/route.ts       # iOS → App Store / 그 외 → Play Store
  components/
    Footer.tsx
Dockerfile                  # node:22-alpine multi-stage, standalone
next.config.ts              # output: 'standalone', .html → 깨끗 URL redirect
```

## 운영 인프라

- **호스트**: Coolify (자체 호스팅)
- **DB**: 공유 Postgres (`postgres-shared`), 앱별 분리 DB/유저
- **이미지 레지스트리**: 자체 호스팅 `registry.pixelwave.app` (Cloudflare R2 백엔드)
- **DB 백업**: Cloudflare R2 `pixelwave-backups` daily, 14일 retention
