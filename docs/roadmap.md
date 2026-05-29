# Roadmap

> 큰 그림. 우선순위 마감일은 두지 않고, 트리거 기반으로 진입.

## 현재 (2026-05-29)

- 운영 인입: pixelwave.app · www · invest-note · today-alive 모두 Coolify Traefik
- 운영 코드: release/v0.1.4 (`beabc9e`) — Phase 3 까지. admin 로그인 / `/b/...` 라우트 코드는 아직 운영 미적용 (Phase 4, `develop` HEAD).
- 게시판 v1 의 운영 콘텐츠 0건.

## 다음 마일스톤 — release/v0.1.5

게시판 v1 운영 적용. 트리거: 사용자가 보드 운영 의향 결정.

- [ ] `develop` → release/v0.1.5 cut → main 머지 + tag
- [ ] Coolify Image Tag 새 sha 로 갱신 + Redeploy
- [ ] 운영 admin (`https://pixelwave.app/admin`) 에서 첫 보드/글 생성
- [ ] 외부에서 정본/서브도메인 노출 확인 (canonical + 화이트리스트)

## 그 이후 — 트리거 발생 시 진입

| 항목 | 트리거 |
|---|---|
| Postgres 튜닝값 적용 (Task #21) | 연결수 30 이상 정착 / 메모리 압박 |
| 백업 복구 리허설 | 운영 데이터 들어온 후 안정성 검증 필요 시 |
| CF Proxy ON (운영 4 도메인) | 트래픽 증가 / DDoS 우려 |
| Coolify image pull 자동화 (sha 박는 손작업 제거) | release 빈도 증가로 손작업 부담 |
| hub 랜딩 "최근 글" 인덱스 (Phase 4.5) | hub 정본 노출 필요 발생 |
| 댓글 / 다중 작성자 | 운영 수요 발생 |
| 이미지 업로드 외부화 (R2/S3) | 트래픽/용량 임계 도달 |
| 사양 업그레이드 4GB→8GB | 같은 박스에 앱 추가 / swap 상시 사용 / Postgres 활성 연결수 30 이상 / 일 10,000 PV 초과 |
| FastAPI 도입 | 모바일 앱과 API 공유 등 별도 백엔드 수요 |

## 비목표 (현 시점)

- 모바일 앱 SDK / API 공유
- 다국어
- SSO / SAML
- A/B 테스트, 트래픽 분석
