# Backlog

> 우선순위 / 트리거 / 분류로 묶은 후속 작업 큐. 마감일은 두지 않는다.

## P2 — 운영 안정성

- [ ] **Postgres 튜닝값 적용** (Task #21). 트리거: 연결수/메모리 압박. §issue-current §4 + decisions D-04.
  - `shared_buffers=256MB`, `effective_cache_size=1GB`, `work_mem=8MB`, `maintenance_work_mem=64MB`, `max_connections=100`.
- [ ] **백업 복구 리허설**. R2 의 dump 로 임시 Postgres 컨테이너에 restore → 최신 schema 와 비교. 트리거: 운영 데이터 들어온 직후.

## P3 — 기능 / 정책 (v1 이후)

- [ ] hub 랜딩 "최근 글" 인덱스 (Phase 4.5). 현재 hub redirect 유지 결정 (D-15).
- [ ] hub/login 버튼의 `.store-badges` 재사용 정리 — 랜딩용 클래스를 로그인 버튼이 차용 중(사실상 no-op 스타일). 전용 버튼 스타일로 교체 후 `.store-badges` 클래스 제거.
- [ ] 댓글 기능. moderation 부담 큼 — 운영 수요 확인 후 진입.
- [ ] 다중 작성자. `users.role` 확장, NextAuth 의 signIn 콜백 / 화이트리스트 로직 분리.
- [ ] 이미지 업로드 외부화. v1 은 Coolify volume + Next.js 정적 서빙. R2/S3 이행은 트래픽/용량 임계 도달 시.
- [ ] 사양 업그레이드 4GB→8GB. §issue-current §6 의 서버 사양 표 참고.

## P4 — 보안 / 인프라

- [ ] CF Proxy ON (운영 4 도메인). 한 도메인씩 점진 적용 + 헤더 확인. SSL/TLS mode = "Full (strict)". revalidatePath ↔ CF cache 미연동 위험 인지.
- [ ] (선택) CF Total TLS 또는 `*.invest-note.pixelwave.app` Advanced Certificate — `api.invest-note` 같은 2단계 서브 추가 시.
- [ ] (선택) AUTH_SECRET 회전 정책 (예: 1년).
- [ ] (선택) registry · R2 토큰 회전 정책.

## 종료된 항목 (참고)

- 랜딩 리디자인 양 도메인 이식 (2026-06-06). invest-note·today-alive 모두 Stitch 시안 → Tailwind v4 이식 완료 (issue-history 2026-06-06 2건). 레거시 랜딩 CSS 중 `.features`/`.feature` 제거 — `.hero` 는 hub placeholder, `.store-badges` 는 hub/login 이 사용 중이라 보존(P3 정리 항목 등록). today-alive metadata 는 데일리 체크인 포지셔닝으로 전환.
- registry 레거시 철거 (D-20, 2026-05-30). registry:2 컨테이너 + R2 `pixelwave-registry` 버킷/`pixelwave-registry-rw` 토큰 + `registry.pixelwave.app` 도메인/CF DNS + Coolify 자격증명(`docker logout`) 제거. 검증: DNS·registry API 죽음 + pixelwave-web `/api/version`·4도메인 정상. 백업 R2(`pixelwave-backups`)는 유지. 부수: 미사용 CF Pages 빌드 토큰 정리.
- CF Pages/Workers 잔재 제거 (sites/, shared/, wrangler.jsonc 등)
- README 갱신 (Coolify/Next.js 가이드)
- public/*.svg 5개 제거
- docs/migration-plan.md → 4 파일로 분리 (D-17)
- Coolify 자동 배포 — v* 태그 push → GHA 가 빌드+push 후 deploy API 트리거 (D-19). main 트리거 제거로 이중 빌드 제거. 캐시(image tag PATCH)는 `:latest` 로도 미발생이라 보류. `/api/version` 으로 반영 검증.
