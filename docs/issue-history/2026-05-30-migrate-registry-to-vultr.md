# Spec: 이미지 레지스트리 Vultr Container Registry 이전

> 완료(레포): 2026-05-30 — 인프라 컷오버(Phase 1~2)·레거시 철거(Phase 3, backlog P4)는 develop 머지 후 별도 진행.

## 배경 / 문제

자체 호스팅 `registry.pixelwave.app`(registry:2 + Cloudflare R2 백엔드, D-06/07)은
운영 부담과 워크어라운드를 동반한다 — D-12(OCI manifest 거부 → provenance/sbom/oci-mediatypes off),
D-13(R2 multipart 일관성 → CHUNKSIZE 100MB), htpasswd 인증, Traefik LE, R2 버킷/토큰 관리.
Vultr Container Registry(무료 10GB, OCI 네이티브)로 이전하면 이 운영 스택과 워크어라운드를
통째로 제거할 수 있다. **DB 백업 R2(`pixelwave-backups`, D-08)는 이전 대상이 아니며 그대로 유지한다.**

## 목표

- GHA가 Vultr CR로 이미지를 빌드/push하고, Coolify가 Vultr CR에서 pull해 배포된다.
- `v*` 태그 push → `/api/version`에 새 sha/ref/build_time이 반영된다.
- 4개 운영 도메인이 정상 동작한다.
- 자체 registry:2 + R2 registry 버킷/토큰/도메인/인증 등 레거시가 완전히 제거된다.
- DB 백업 R2(`pixelwave-backups`)는 영향받지 않는다.

## 설계

### 접근 방식

"새 경로 구축 → 검증 → 레거시 철거" 순서로 롤백 여지를 유지한다.
인프라(Vultr/Coolify/CF/R2 콘솔) 작업은 사용자가, 레포 작업(`build.yml`+문서)은 Claude가 수행한다.
이미지 경로(`pixelwave-web:<tag>`)는 동일하므로 GHA secret 값 교체 + 워크어라운드 제거만으로 충분하다.

### 주요 변경 파일 (레포 작업)

- `.github/workflows/build.yml` — 60번 줄 `outputs: type=registry,oci-mediatypes=false` → `type=registry`
  (D-13 R2 multipart 이슈 자동 소멸). 56–57번 줄 registry:2 주석 갱신. `provenance/sbom: false`는
  10GB 절약·manifest 단순화를 위해 유지. tags 블록·Coolify 트리거는 변경 없음.
- `docs/decisions.md` — D-20 추가. D-07/D-12/D-13을 supersede 명시
  (트레이드오프: 비용 동일($0), 운영 단순화↑, 벤더 종속↑).
- `README.md` — "운영 인프라" + "배포 흐름" 다이어그램의 `registry.pixelwave.app` → Vultr.
- `.env.example` — registry 관련 코멘트 갱신.

### 인프라 작업 (사용자, 레포 밖)

- Vultr: Container Registry 생성(무료/10GB, Coolify 근접 리전), Docker 자격증명 발급.
- GitHub Secrets: `REGISTRY_URL`/`REGISTRY_USERNAME`/`REGISTRY_PASSWORD`를 Vultr 값으로 교체. `COOLIFY_*`는 유지.
- Coolify: Vultr 레지스트리 자격증명 등록, `pixelwave-web` 앱 이미지 host를 Vultr로 변경 + Image Tag 갱신.
- 레거시 철거(검증 후): registry:2 서비스, R2 registry 버킷·`registry` rw 토큰, Traefik 라우트,
  `registry.pixelwave.app` CF DNS, htpasswd, Coolify 옛 `pixelwave-registry` 자격증명.

## 구현 체크리스트

### 레포 (Claude)
- [x] `build.yml` — oci-mediatypes 워크어라운드 제거 + 주석 갱신
- [x] `docs/decisions.md` — D-20 추가 (D-07/D-12/D-13 supersede)
- [x] `README.md` — 인프라/배포흐름 registry 호스트 갱신
- [~] `.env.example` — registry 변수 없음(자격증명은 GHA secret) → 변경 불필요

### 인프라 게이트 (사용자) — 레포 머지 전/후 컷오버 (develop 머지 후 진행 중)
- [x] Phase 0: Vultr 레지스트리 생성(`icn.vultrcr.com/pixelwave`) + `docker login`/push/pull 검증 (제한 없음 확인)
- [ ] Phase 1: GHA secret 교체 + Coolify 호스트 변경 (2-A/2-B 완료, GHA secret 교체 진행)
- [ ] Phase 2: `v*` 태그 push → `/api/version` 반영 + 4개 도메인 검증
- [ ] Phase 3: 공유 범위 확인 후 레거시 철거 (백업 R2 제외) → backlog P4 등록

## 우려사항 / 리스크

- **Pull rate limit / egress 스로틀** — 무료 티어 문서 미명시. Phase 0에서 반드시 실측. 배포마다 pull.
- **무료 티어 프로덕션 적합성** — 문서가 Start Up을 "testing/learning/small-scale"로 한정. 약한 신호.
- **공유 범위** — `registry.pixelwave.app`이 다른 프로젝트도 받고 있으면 그것부터 이전 필요(레포 밖 확인).
- **벤더 종속 ↑** — D-07의 "운영 종속 줄임" 의도와 역행. 단 이미지 재푸시 용이로 락인 위험 낮음.
- DB 백업 R2(`pixelwave-backups`)는 **절대 건드리지 않는다** — registry R2와 토큰/버킷이 분리됨(D-08).
