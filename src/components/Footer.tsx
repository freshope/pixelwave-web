type FooterLink = { href: string; label: string };

type FooterProps = {
  siteName: string;
  links: FooterLink[];
  supportEmail: string;
};

export function Footer({ siteName, links, supportEmail }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div>
        © {year} {siteName}. All rights reserved.
      </div>
      <nav>
        {links.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
        <a href={`mailto:${supportEmail}`}>문의</a>
      </nav>
    </footer>
  );
}
