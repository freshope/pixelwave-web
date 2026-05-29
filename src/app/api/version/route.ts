// 배포된 컨테이너의 빌드 식별자를 노출한다 (캐시/이미지 반영 확인용).
// 값은 Dockerfile 의 ARG→ENV 로 이미지에 구워지며, GHA build-args 로 주입된다.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    version: process.env.APP_VERSION ?? "dev",
    commit: process.env.GIT_SHA ?? "unknown",
    buildTime: process.env.BUILD_TIME ?? "unknown",
  });
}
