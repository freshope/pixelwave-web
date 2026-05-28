type FooterProps = {
  siteName: string;
  privacyHref: string;
  termsHref: string;
  supportEmail: string;
};

export function Footer({
  siteName,
  privacyHref,
  termsHref,
  supportEmail,
}: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div>
        © {year} {siteName}. All rights reserved.
      </div>
      <nav>
        <a href={privacyHref}>개인정보처리방침</a>
        <a href={termsHref}>서비스 이용약관</a>
        <a href={`mailto:${supportEmail}`}>문의</a>
      </nav>
    </footer>
  );
}
