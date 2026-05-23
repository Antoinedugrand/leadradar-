import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import "./landing.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeadRadar — Find local businesses that need a new website",
  description:
    "Scan any city on a map, score prospects automatically, audit their site, and send a personalized pitch — powered by AI.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap"
        rel="stylesheet"
      />
      <div className={`${jetbrainsMono.variable} landing-page`}>{children}</div>
    </>
  );
}
