# Backlog

> 우선순위 / 트리거 / 분류로 묶은 후속 작업 큐. 마감일은 두지 않는다.

## P1 — 트리거 곧

- [ ] **Phase 4 운영 적용**: release/v0.1.5 cut + main 머지 + push + Coolify Image Tag 새 sha 갱신 + Redeploy. 그 후 운영 admin 에서 보드/글 운영.
- [ ] **CF Workers/Pages 콘솔 잔재 확인** — `pixelwave-hub`/`pixelwave-invest-note`/`pixelwave-today-alive` 프로젝트 (있다면) 삭제. _2026-05-29 사용자 처리 완료 보고._

## P2 — 운영 안정성

- [ ] **Postgres 튜닝값 적용** (Task #21). 트리거: 연결수/메모리 압박. §spec-current §4 + decisions D-04.
  - `shared_buffers=256MB`, `effective_cache_size=1GB`, `work_mem=8MB`, `maintenance_work_mem=64MB`, `max_connections=100`.
- [ ] **백업 복구 리허설**. R2 의 dump 로 임시 Postgres 컨테이너에 restore → 최신 schema 와 비교. 트리거: 운영 데이터 들어온 직후.
- [ ] **Coolify 자동 배포 (v* 태그 트리거)**. 트리거 조건: 위 `Phase 4 운영 적용` 류의 수동 Image Tag 갱신이 번거로워 재발 시 적용 (현재는 보류, 사용자 결정 2026-05-29).
  - **목표**: v* 태그 push → GHA 가 Coolify 에 자동 배포. 매번 Image Tag 손수정 제거.
  - **함정 (조사 완료 2026-05-29)**: deploy webhook 을 `force=true` 로 호출해도 **registry 최신 이미지를 pull 하지 않고 restart 만** 한다 (Coolify Issue #5318, v4.1.1 기준 open). UI 우상단 `Deploy ▾` → `Pull latest image(s) and restart` 는 수동 액션이라 webhook 자동화로는 대체 안 됨. 이게 D-16 캐시 현상의 원인으로 추정.
  - **결론**: `latest`(mutable) 고정 + webhook 은 신뢰성 없음. **immutable 참조 자동 set** 만 견고함 — GHA 가 v* 태그 push 시 Coolify API 로 image tag 를 `:v1.2.3`(또는 digest) 로 PATCH → deploy 트리거. 매번 새 참조라 캐시 못 묾 (D-16 검증 경로).
  - **구현 전 확인**: Coolify v4.1.1 의 정확한 API endpoint/필드명(image tag PATCH + deploy) 을 공식 문서로 확정. deploy 권한 API token + app UUID 를 GHA secret 으로.
  - build.yml 의 `v*` 태그 트리거 + `:v1.2.3`/`:latest` 태깅은 이미 적용됨 (D-18).

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

## 종료된 항목 (참고)

- CF Pages/Workers 잔재 제거 (sites/, shared/, wrangler.jsonc 등)
- README 갱신 (Coolify/Next.js 가이드)
- public/*.svg 5개 제거
- docs/migration-plan.md → 4 파일로 분리 (D-17)
