type FooterLink = { href: string; label: string; newTab?: boolean };

type FooterProps = {
  siteName: string;
  links: FooterLink[];
  supportEmail: string;
  className?: string;
};

export function Footer({ siteName, links, supportEmail, className }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className={className ? `site-footer ${className}` : "site-footer"}>
      <div>
        © {year} {siteName}. All rights reserved.
      </div>
      <nav>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            {...(l.newTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {l.label}
          </a>
        ))}
        <a href={`mailto:${supportEmail}`}>문의</a>
      </nav>
    </footer>
  );
}
