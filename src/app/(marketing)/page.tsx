import { Suspense } from "react";

import { LandingPage } from "./_components/landing-page";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}
