# pixelwave-web

Pixelwave 산하 사이트들의 통합 Next.js 앱. host 헤더 기반으로 한 컨테이너에서 사이트별 라우팅을 분기 서빙한다.

## 도메인 매핑

| 도메인 | 라우팅 |
|---|---|
| `pixelwave.app`, `www.pixelwave.app` | `invest-note.pixelwave.app` 로 301 (임시 — Phase 3 의 진짜 hub 등장 전까지) |
| `invest-note.pixelwave.app` | `src/app/invest-note/*` (랜딩 + privacy / terms / account-deletion) |
| `today-alive.pixelwave.app` | `src/app/today-alive/*` (랜딩 + privacy / terms + `/invite` UA 분기) |
| `next.pixelwave.app` | 검증용. host 가 매핑되지 않으면 hub placeholder 노출 |

`src/proxy.ts` 가 host 헤더로 site 를 판별, path 앞에 `/<site>` prefix 를 붙여 rewrite (Next.js 16 의 `middleware` → `proxy` 컨벤션).

## 로컬 개발

```bash
pnpm install
pnpm dev              # http://localhost:3100/
```

host 별 라우팅 검증:

```bash
curl -H 'Host: invest-note.pixelwave.app' http://localhost:3100/
curl -H 'Host: today-alive.pixelwave.app' -A 'iPhone' http://localhost:3100/invite
```

## 배포 흐름

```
git push (main|develop)
  ↓
GitHub Actions  (.github/workflows/build.yml)
  ↓ docker buildx (linux/amd64, OCI manifest off)
registry.pixelwave.app/pixelwave-web:<short-sha>  +  :<branch>
  ↓ docker pull
Coolify (pixelwave-web 프로젝트) → Traefik LE → 4개 도메인
```

자세한 인프라·결정 사항은 [`docs/migration-plan.md`](docs/migration-plan.md) 참고.

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
