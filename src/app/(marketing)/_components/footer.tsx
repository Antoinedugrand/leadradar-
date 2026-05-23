import { Lock, Shield } from "lucide-react";

import { CookieSettingsLink } from "@/components/CookieBanner";
import type { LandingCopy } from "@/lib/i18n/landing";
import { LEGAL } from "@/lib/legal/constants";

import { LanguageSwitch } from "./language-switch";
import { LogoMark } from "./logo-mark";

export function Footer({ copy }: { copy: LandingCopy }) {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: "#fff" }}>
              <LogoMark /> LeadRadar
            </div>
            <p style={{ marginTop: 14, fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}>
              {copy.footer.tagline}
            </p>
            <div style={{ marginTop: 16 }}>
              <LanguageSwitch variant="dark" showOnMobile />
            </div>
          </div>
          <div>
            <h4>{copy.footer.product}</h4>
            <ul>
              <li>
                <a href="#features">{copy.nav.features}</a>
              </li>
              <li>
                <a href="#pricing">{copy.nav.pricing}</a>
              </li>
              <li>
                <a href="#faq">{copy.nav.faq}</a>
              </li>
              <li>
                <a href="#compare">{copy.nav.compare}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>{copy.footer.legal}</h4>
            <ul>
              <li>
                <a href="/legal">{copy.footer.legalIndex}</a>
              </li>
              <li>
                <a href="/legal/terms">{copy.footer.terms}</a>
              </li>
              <li>
                <a href="/legal/privacy">{copy.footer.privacy}</a>
              </li>
              <li>
                <a href="/legal/gdpr">{copy.footer.gdpr}</a>
              </li>
              <li>
                <a href="/legal/cookies">{copy.footer.cookies}</a>
              </li>
              <li>
                <CookieSettingsLink className="cursor-pointer bg-transparent text-left text-inherit hover:text-white" />
              </li>
            </ul>
          </div>
          <div>
            <h4>{copy.footer.contact}</h4>
            <ul>
              <li>
                <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
              </li>
              <li>
                <a href="#">{copy.footer.status}</a>
              </li>
              <li>
                <a href="#">{copy.footer.changelog}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bot">
          <div>{copy.footer.copyright}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Shield size={13} aria-hidden="true" /> {copy.footer.gdprReady}
            <span style={{ opacity: 0.4 }}>·</span>
            <Lock size={13} aria-hidden="true" /> {copy.footer.stripeSecured}
          </div>
        </div>
      </div>
    </footer>
  );
}
