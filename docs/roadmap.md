# Roadmap

> 큰 그림. 우선순위 마감일은 두지 않고, 트리거 기반으로 진입.

## 현재 (2026-06-14)

- 운영 인입: pixelwave.app · www · invest-note · today-alive 모두 Coolify Traefik
- 운영 코드: release/v0.2.2 — 게시판 v1(Phase 4) 운영 적용 완료. admin 로그인 / `/b/...` 공개 라우트 + board_sites 화이트리스트 운영 반영.
- 이후 반영: 이미지 레지스트리 Vultr 이전(v0.1.9, registry 레거시 철거), `/api/version` 엔드포인트, invest-note·today-alive 랜딩 리디자인(v0.2.0) + 라우트별 파비콘(v0.2.1), PostHog 도입 + 개인정보처리방침 갱신(v0.2.2).

## 다음 마일스톤

현재 트리거된 마일스톤 없음 — 아래 "그 이후" 트리거 표 기반으로 진입.

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
