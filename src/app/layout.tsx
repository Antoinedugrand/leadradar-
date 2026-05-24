import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { CookieBanner } from "@/components/CookieBanner";
import { VercelAnalyticsGate } from "@/components/VercelAnalyticsGate";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { satoshi } from "@/lib/fonts";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { createT } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = createT(locale);
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <CookieConsentProvider>
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
          <CookieBanner />
          <VercelAnalyticsGate />
          <Toaster richColors position="top-right" />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
