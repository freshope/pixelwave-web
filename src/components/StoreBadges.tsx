import Image from "next/image";
import playBadge from "../../public/images/badges/google-play-ko.png";

type StoreBadgesProps = {
  appStoreUrl: string;
  playUrl: string;
  justify: string;
};

export function StoreBadges({ appStoreUrl, playUrl, justify }: StoreBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${justify}`}>
      <a
        href={appStoreUrl}
        aria-label="App Store 에서 받기"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform active:scale-95"
      >
        {/* SVG 는 이미지 최적화 대상이 아니므로 img 유지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/badges/app-store-ko.svg"
          alt="App Store에서 다운로드"
          width={156}
          height={48}
          className="h-12 w-auto"
        />
      </a>
      <a
        href={playUrl}
        aria-label="Google Play 에서 받기"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform active:scale-95"
      >
        <Image
          src={playBadge}
          alt="Google Play에서 다운로드"
          width={140}
          height={54}
          className="h-[54px] w-auto"
        />
      </a>
    </div>
  );
}
