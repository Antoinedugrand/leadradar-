"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";

import { useLandingCopy } from "@/lib/i18n/landing";

import { LanguageSwitch } from "./language-switch";
import { LogoMark } from "./logo-mark";

export function Navbar() {
  const t = useLandingCopy();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "#features", label: t.nav.features },
    { href: "#how", label: t.nav.how },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#compare", label: t.nav.compare },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#top" className="logo">
          <LogoMark />
          LeadRadar
        </a>
        <div className="nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-right">
          <LanguageSwitch />
          <Link className="btn btn-secondary btn-sm" href="/login">
            {t.nav.login}
          </Link>
          <a className="btn btn-gradient btn-sm" href="#pricing">
            {t.nav.cta}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="nav-mobile-toggle"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
      <div className={`nav-mobile-menu${menuOpen ? " open" : ""}`}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <Link href="/login" onClick={() => setMenuOpen(false)}>
          {t.nav.login}
        </Link>
        <LanguageSwitch showOnMobile />
      </div>
    </nav>
  );
}
