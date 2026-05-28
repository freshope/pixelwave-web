# pixelwave-web

Pixelwave 산하 프로젝트들의 정적 웹사이트(랜딩 + 법적 문서)를 통합 관리하는 모노레포.

## 도메인 매핑

| 도메인                              | 사이트 디렉토리            | CF Pages 프로젝트명         | 비고                       |
| ----------------------------------- | -------------------------- | --------------------------- | -------------------------- |
| `pixelwave.app`                     | `sites/hub/`               | `pixelwave-hub`             | invest-note 로 301 리다이렉트 |
| `invest-note.pixelwave.app`         | `sites/invest-note/`       | `pixelwave-invest-note`     | 랜딩 + privacy + terms     |
| `<next-project>.pixelwave.app`      | `sites/<next-project>/`    | `pixelwave-<next-project>`  | (예정)                     |

`api.<project>.pixelwave.app` 은 각 프로젝트의 FastAPI 서버를 가리키며 이 저장소와 무관하다.

## 디렉토리 구조

```
shared/         공통 자산 (디자인 토큰·푸터 템플릿). 새 사이트의 시드로 사용.
  styles/base.css
  partials/footer.html

sites/          각 도메인에 대응하는 정적 사이트. CF Pages 프로젝트당 1개.
  hub/                pixelwave.app
  invest-note/        invest-note.pixelwave.app
```

각 `sites/<name>/` 디렉토리는 독립 빌드 단위다. CF Pages 프로젝트에서 **Root directory** 옵션으로 해당 폴더를 가리키면 그 폴더 변경 시에만 빌드된다.

## 새 프로젝트 추가 절차

1. `sites/<name>/` 폴더 생성, `shared/styles/base.css` 를 `sites/<name>/styles.css` 로 복사.
2. `index.html`, `privacy.html`, `terms.html` 을 invest-note 사이트를 참고해 작성.
3. CF Pages 에서 새 프로젝트 생성 → 이 저장소 연결 → Root directory `sites/<name>` 지정.
4. 커스텀 도메인 `<name>.pixelwave.app` 연결.
5. 이 README 의 도메인 매핑 표에 한 줄 추가.

## 스타일 변경 시

`shared/styles/base.css` 는 마스터 카피다. 디자인 토큰을 바꿨다면 `sites/*/styles.css` 에도 동일하게 반영하거나, 한쪽만 바꾸고 차후에 sync 한다. 사이트가 늘어 sync 부담이 커지면 빌드 단계로 자동 복사하는 스크립트를 추가한다.

## 로컬 미리보기

```bash
cd sites/invest-note
python3 -m http.server 8080
# 또는: npx http-server -p 8080
```

브라우저에서 `http://localhost:8080/` 열면 됨.
