# Backlog

> 우선순위 / 트리거 / 분류로 묶은 후속 작업 큐. 마감일은 두지 않는다.

## P1 — 트리거 곧

- [ ] **Phase 4 운영 적용**: release/v0.1.5 cut + main 머지 + push + Coolify Image Tag 새 sha 갱신 + Redeploy. 그 후 운영 admin 에서 보드/글 운영.
- [ ] **CF Workers/Pages 콘솔 잔재 확인** — `pixelwave-hub`/`pixelwave-invest-note`/`pixelwave-today-alive` 프로젝트 (있다면) 삭제. _2026-05-29 사용자 처리 완료 보고._

## P2 — 운영 안정성

- [ ] **Postgres 튜닝값 적용** (Task #21). 트리거: 연결수/메모리 압박. §spec-current §4 + decisions D-04.
  - `shared_buffers=256MB`, `effective_cache_size=1GB`, `work_mem=8MB`, `maintenance_work_mem=64MB`, `max_connections=100`.
- [ ] **백업 복구 리허설**. R2 의 dump 로 임시 Postgres 컨테이너에 restore → 최신 schema 와 비교. 트리거: 운영 데이터 들어온 직후.

## P3 — 기능 / 정책 (v1 이후)

- [ ] hub 랜딩 "최근 글" 인덱스 (Phase 4.5). 현재 hub redirect 유지 결정 (D-15).
- [ ] 댓글 기능. moderation 부담 큼 — 운영 수요 확인 후 진입.
- [ ] 다중 작성자. `users.role` 확장, NextAuth 의 signIn 콜백 / 화이트리스트 로직 분리.
- [ ] 이미지 업로드 외부화. v1 은 Coolify volume + Next.js 정적 서빙. R2/S3 이행은 트래픽/용량 임계 도달 시.
- [ ] 사양 업그레이드 4GB→8GB. §spec-current §6 의 서버 사양 표 참고.

## P4 — 보안 / 인프라

- [ ] CF Proxy ON (운영 4 도메인). 한 도메인씩 점진 적용 + 헤더 확인. SSL/TLS mode = "Full (strict)". revalidatePath ↔ CF cache 미연동 위험 인지.
- [ ] (선택) CF Total TLS 또는 `*.invest-note.pixelwave.app` Advanced Certificate — `api.invest-note` 같은 2단계 서브 추가 시.
- [ ] (선택) AUTH_SECRET 회전 정책 (예: 1년).
- [ ] (선택) registry · R2 토큰 회전 정책.
- [ ] **registry 레거시 철거** (D-20). Vultr 컷오버(`v*` 태그 배포 + `/api/version`·4도메인 검증) 후: 자체 `registry:2` 컨테이너 + R2 registry 버킷/`registry` 토큰 + Traefik 라우트 + `registry.pixelwave.app` CF DNS + htpasswd + Coolify 옛 자격증명 제거. **백업 R2(`pixelwave-backups`)는 제외.** 트리거: 컷오버 검증 완료.

## 종료된 항목 (참고)

- CF Pages/Workers 잔재 제거 (sites/, shared/, wrangler.jsonc 등)
- README 갱신 (Coolify/Next.js 가이드)
- public/*.svg 5개 제거
- docs/migration-plan.md → 4 파일로 분리 (D-17)
- Coolify 자동 배포 — v* 태그 push → GHA 가 빌드+push 후 deploy API 트리거 (D-19). main 트리거 제거로 이중 빌드 제거. 캐시(image tag PATCH)는 `:latest` 로도 미발생이라 보류. `/api/version` 으로 반영 검증.
