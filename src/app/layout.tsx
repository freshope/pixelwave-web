import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixelwave",
  description: "Pixelwave 의 서비스 모음",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
