"use client";

import { useSearchParams } from "next/navigation";

import { useLandingCopy } from "@/lib/i18n/landing";

import { BeforeAfter } from "./before-after";
import { CompareTable } from "./compare-table";
import { FAQ } from "./faq";
import { FeaturesGrid } from "./features-grid";
import { FinalCTA } from "./final-cta";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Navbar } from "./navbar";
import { Pricing } from "./pricing";
import { ProductBento } from "./product-bento";
import { VideoSection } from "./video-section";

export function LandingPage() {
  const copy = useLandingCopy();
  const searchParams = useSearchParams();
  const headlineVariant = searchParams.get("h")?.toUpperCase() === "B" ? "B" : "A";

  return (
    <>
      <Navbar />
      <main>
        <Hero copy={copy} headlineVariant={headlineVariant} />
        <BeforeAfter copy={copy} />
        <FeaturesGrid copy={copy} />
        <HowItWorks copy={copy} />
        <ProductBento copy={copy} />
        <VideoSection copy={copy} />
        <CompareTable copy={copy} />
        <Pricing copy={copy} />
        <FAQ copy={copy} />
        <FinalCTA copy={copy} />
      </main>
      <Footer copy={copy} />
    </>
  );
}
