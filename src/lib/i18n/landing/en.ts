export const landingEn = {
  meta: {
    title: "LeadRadar — Find local businesses that need a new website",
    description:
      "Scan any city on a map, score prospects automatically, audit their site, and send a personalized pitch — powered by AI.",
  },
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    compare: "Compare",
    faq: "FAQ",
    cta: "Get started",
    login: "Log in",
  },
  hero: {
    badge: "AI-assisted prospecting",
    headlineA: "Find local businesses that need a new website.",
    headlineB: "Your prospecting radar for web redesign clients.",
    sub: "Scan any city on a map, score prospects automatically, audit their site, and send a personalized pitch — powered by AI.",
    ctaPrimary: "Start for $29.99/mo",
    ctaSecondary: "Watch demo",
    meta: [
      "No credit card to explore",
      "Cancel anytime",
      "Built for freelancers & small agencies",
    ],
  },
  beforeAfter: {
    eyebrow: "The shift",
    title: "Cold prospecting is broken. Replace it with a workflow that converts.",
    intro:
      "You spend hours hunting on Google Maps, write generic emails into the void, and have nothing concrete to show the business owner on the call. LeadRadar collapses that into a single, repeatable loop.",
    badLabel: "Before · the old way",
    badTitle: "Spreadsheets, guesswork, silence.",
    badItems: [
      "Hours on Google Maps copy-pasting into a spreadsheet",
      "No way to tell which businesses actually need help",
      "Generic cold emails with a <2% reply rate",
      "Nothing concrete to show on the discovery call",
      "No system — every lead is a fresh start",
    ],
    goodLabel: "With LeadRadar",
    goodTitle: "Map → score → audit → pitch → close.",
    goodItems: [
      'Draw a zone on a map; get a scored list in minutes',
      '"No website" and "audit < 50" flagged automatically',
      "AI emails personalised to each prospect's actual problem",
      "A free demo site mockup attached to every cold pitch",
      "Pipeline view + Excel export keeps the whole loop tidy",
    ],
  },
  features: {
    eyebrow: "Features",
    title: 'Everything you need between "I found them" and "they said yes."',
    items: [
      {
        num: "01",
        title: "Interactive map search",
        body: "Pick a city or draw a zone, adjust radius, and see every business inside it on a live map.",
      },
      {
        num: "02",
        title: "Smart prospect scoring",
        body: 'Hot / Warm / Cold labels assigned from review counts, web presence, and category signals. "No website" is always Hot.',
      },
      {
        num: "03",
        title: "Automatic design audit",
        body: "Score out of 100 with a flagged list of issues — mobile-broken, no SSL, slow LCP, no booking, missing schema.",
      },
      {
        num: "04",
        title: "AI outreach emails",
        body: "Personalised pitch generated from each prospect's actual audit findings. Edit before you send.",
      },
      {
        num: "05",
        title: "Demo site mockups",
        body: "Generate a shareable one-page site preview tailored to the business — attach it to the email and let the work speak.",
      },
      {
        num: "06",
        title: "Pipeline & export",
        body: "Track who you contacted, who replied, who converted. One-click Excel export when you need to leave the app.",
      },
    ],
  },
  how: {
    eyebrow: "How it works",
    title: 'From "I need clients" to "pitch sent" — in three steps.',
    steps: [
      {
        title: "Scan",
        body: "Choose a city or draw a polygon on the map. LeadRadar pulls every relevant business and starts auditing in the background.",
      },
      {
        title: "Qualify",
        body: "Filter Hot leads, run batch audits, and let the score tell you which doors are worth knocking on first.",
      },
      {
        title: "Pitch",
        body: "Send an AI-drafted email built around the audit, attach a generated demo site, and track replies in the built-in pipeline.",
      },
    ],
    pitchSnippet:
      "Hi Joe — saw your 4.8★ rating but no booking page. Here's a quick mockup of what a site for the shop could look like…",
    pitchLabel: "AI · Personalised for Joe's",
    send: "Send",
    preview: "Preview",
  },
  bento: {
    eyebrow: "Product tour",
    title: "A closer look at the workflow.",
    watchDemo: "Watch the full demo",
    dashboard: {
      badge: "Dashboard",
      title: "Your prospecting at a glance.",
      body: "Live counts of prospects found, missing sites, failing audits, and contacted leads — broken down per zone, per week.",
      zone: "Austin · This week",
      live: "Live",
      prospects: "Prospects",
      noWebsite: "No website",
      badSites: "Bad sites",
      contacted: "Contacted",
      chartLabel: "Pipeline · last 14 days",
      deltaToday: "+128 today",
      deltaPool: "24% of pool",
      deltaAudit: "Audit < 50",
      deltaReplies: "7 replies",
    },
    audit: {
      badge: "Audit",
      title: "Every site, scored.",
      body: "Mobile, security, speed, and trust signals — converted into a single 0-100 number.",
      scoreLabel: "Audit score",
      domain: "pinacafe-austin.com",
      hotProspect: "Hot prospect",
      rows: [
        { label: "Mobile responsive", val: "Failing" },
        { label: "HTTPS / Security", val: "No SSL" },
        { label: "Page speed", val: "8.4s LCP" },
        { label: "Booking system", val: "None detected" },
      ],
    },
    demo: {
      badge: "Demo mockups",
      title: "Show, don't pitch.",
      body: "Generate a personalised one-page site preview per prospect and attach it to the email.",
      generated: "Generated",
      previewUrl: "preview.leadradar.us/joes-barbershop",
      brand: "JOE'S.",
      nav: ["Cuts", "Hours", "Book"],
      headline: "A proper cut.\nSouth Austin since '08.",
      sub: "Walk-ins welcome. Book online for Saturdays.",
      cta: "Book a chair",
      phone: "Call (512) 555-0144",
    },
    pipeline: {
      badge: "Pipeline",
      title: 'Move a lead from "found" to "won" without leaving the app.',
      body: "Drag prospects across stages. Export to Excel any time.",
      export: "Export .xlsx",
      columns: [
        { title: "New", count: 312, items: ["Joe's Barbershop", "Piña Café", "Morrow Hair"] },
        { title: "Contacted", count: 96, items: ["Thread & Bobbin", "Salt Yoga"] },
        { title: "Replied", count: 14, items: ["Ember Pizza"] },
        { title: "Won", count: 4, items: ["Lockbox Co."] },
      ],
    },
  },
  mock: {
    prospectsTitle: "Prospects",
    prospectsCount: "Sorted by potential · 237 total",
    hotFilter: "Hot",
    aiScoring: "AI scoring updated 2 min ago",
    mapSearch: "Austin, TX · 78704",
    filters: "6 filters",
    noWebsite: "No website",
    mobileFailing: "Mobile failing",
    radius: "2km radius",
    zoneLabel: "This zone",
    businessesFound: "Businesses found",
    auditLow: "Audit < 50",
    emailDraft: "AI draft",
    emailTo: "To: joe@joesbarbershop.com",
    emailSubject: "A free mockup for Joe's Barbershop",
    emailBodyBefore:
      "Hi Joe — I noticed Joe's Barbershop doesn't have a website yet, but your ",
    emailHighlight: "4.8★ on Google",
    emailBodyAfter:
      " tells me clients love you. I put together a quick one-page mockup to show what a booking-ready site could look like…",
    generated: "Generated",
    demoAttached: "Demo attached",
    appUrl: "app.leadradar.us / map",
    prospects: [
      { id: "joe", initials: "JB", name: "Joe's Barbershop", sub: "512 W Mary St · Barbershop", score: "No site", kind: "hot" as const },
      { id: "pina", initials: "PN", name: "Piña Café & Bakery", sub: "1108 S Lamar · Café", score: "34/100", kind: "hot" as const },
      { id: "morrow", initials: "MR", name: "Morrow Hair Studio", sub: "2200 Manor Rd · Salon", score: "No site", kind: "hot" as const },
      { id: "thread", initials: "TH", name: "Thread & Bobbin Tailoring", sub: "4502 Burnet · Tailoring", score: "52/100", kind: "warm" as const },
      { id: "ember", initials: "EM", name: "Ember Pizza", sub: "1715 E 6th · Restaurant", score: "48/100", kind: "warm" as const },
      { id: "salt", initials: "SL", name: "Salt Yoga Studio", sub: "900 E 7th · Wellness", score: "58/100", kind: "warm" as const },
      { id: "lockbox", initials: "LB", name: "Lockbox Locksmith", sub: "210 Brodie · Services", score: "71/100", kind: "cold" as const },
    ],
    badgeHot: "● Hot",
    badgeWarm: "● Warm",
    badgeCold: "● Cold",
    productPreview: "Product preview",
  },
  video: {
    eyebrow: "See it in motion",
    title: "See LeadRadar in action.",
    sub: "2-minute walkthrough: from drawing a search radius on the map to a sent pitch with a generated mockup attached.",
    live: "● LIVE PREVIEW",
    duration: "02:14",
    stamp: "Austin → Joe's Barbershop",
  },
  compare: {
    eyebrow: "Compare",
    title: "LeadRadar vs. manual prospecting.",
    sub: "Same goal — find a paying web client. Two very different days.",
    manual: "Manual prospecting",
    product: "LeadRadar",
    rows: [
      { feature: "Finding leads", manual: "Hours on Google Maps, copy-paste", product: "Minutes on an interactive map" },
      { feature: "Qualifying", manual: "Gut feeling", product: "AI scoring + automatic web audit" },
      { feature: "Outreach", manual: "Generic templates", product: "Personalised AI emails per prospect" },
      { feature: "Proof on the call", manual: "Nothing to show", product: "Generated demo site mockups" },
      { feature: "Tracking", manual: "Tabs in a spreadsheet", product: "Built-in pipeline + Excel export" },
      { feature: "Setup", manual: "Re-built every project", product: "One subscription, ready in 60 seconds" },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "One plan. Everything included.",
    sub: "No tiers, no trials with credit card walls, no upgrade prompts. Just the tool.",
    planName: "LeadRadar Pro",
    planSub: "For freelancers & small agencies",
    launching: "Launching now",
    perMonth: "/ month",
    features: [
      "Unlimited map searches",
      "AI prospect scoring & audits",
      "AI email generation",
      "Demo site mockups",
      "Pipeline tracking & Excel export",
    ],
    footnote: "Cancel anytime · Secure payment · 7-day money-back guarantee*",
    caveat: "*Placeholder — finalise refund window before launch.",
    trustSsl: "SSL secured checkout",
    trustGdpr: "GDPR-ready",
    trustLang: "EN · FR",
    trustPayments: "Stripe · VISA · MC · AMEX",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions we get asked.",
    items: [
      {
        q: "What types of businesses can I find?",
        a: "Restaurants, hair salons, hotels, cafés, bakeries, gyms, barbershops, tailors, locksmiths — any local establishment listed in Google Places. You can filter by category and by web-presence signals.",
      },
      {
        q: "Where does the business data come from?",
        a: "We pull from Google Places via the official API. Audit data is generated on demand against the public URL the business lists. No scraping of private data.",
      },
      {
        q: "Is LeadRadar GDPR compliant?",
        a: "Yes. We only process publicly available business contact information you query, store it under a documented retention policy, and you remain the controller for any outreach you send. A DPA is available on request.",
      },
      {
        q: "Do I need my own API keys?",
        a: "No — we ship with sensible default limits included in the subscription. Power users can plug in their own Google Places + email provider keys from Settings if they want higher caps.",
      },
      {
        q: "Can I export my prospects?",
        a: "Yes. One-click .xlsx export of any filtered view, including audit scores, status, and your notes. CSV available on request.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes — it's a monthly subscription. Cancel from Settings before the next billing date and you keep access until the end of the period.",
      },
    ],
  },
  finalCta: {
    pill: "Pre-launch · join early",
    title: "Stop guessing. Start scanning.",
    sub: "Find your next web client in minutes — not weeks of cold-email roulette.",
  },
  footer: {
    tagline:
      "The prospecting radar for freelance web designers and small agencies looking for local redesign clients.",
    product: "Product",
    legal: "Legal",
    legalIndex: "Legal information",
    contact: "Contact",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    gdpr: "GDPR / Data Processing",
    cookies: "Cookie policy",
    status: "Status",
    changelog: "Changelog",
    copyright: "© 2026 LeadRadar. All rights reserved.",
    gdprReady: "GDPR-ready",
    stripeSecured: "Stripe-secured",
  },
  legal: {
    placeholder: "This page is a placeholder. Legal content will be finalised before launch.",
  },
};

export type LandingCopy = {
  meta: { title: string; description: string };
  nav: { features: string; how: string; pricing: string; compare: string; faq: string; cta: string; login: string };
  hero: {
    badge: string;
    headlineA: string;
    headlineB: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    meta: string[];
  };
  beforeAfter: {
    eyebrow: string;
    title: string;
    intro: string;
    badLabel: string;
    badTitle: string;
    badItems: string[];
    goodLabel: string;
    goodTitle: string;
    goodItems: string[];
  };
  features: {
    eyebrow: string;
    title: string;
    items: Array<{ num: string; title: string; body: string }>;
  };
  how: {
    eyebrow: string;
    title: string;
    steps: Array<{ title: string; body: string }>;
    pitchSnippet: string;
    pitchLabel: string;
    send: string;
    preview: string;
  };
  bento: {
    eyebrow: string;
    title: string;
    watchDemo: string;
    dashboard: {
      badge: string;
      title: string;
      body: string;
      zone: string;
      live: string;
      prospects: string;
      noWebsite: string;
      badSites: string;
      contacted: string;
      chartLabel: string;
      deltaToday: string;
      deltaPool: string;
      deltaAudit: string;
      deltaReplies: string;
    };
    audit: {
      badge: string;
      title: string;
      body: string;
      scoreLabel: string;
      domain: string;
      hotProspect: string;
      rows: Array<{ label: string; val: string }>;
    };
    demo: {
      badge: string;
      title: string;
      body: string;
      generated: string;
      previewUrl: string;
      brand: string;
      nav: string[];
      headline: string;
      sub: string;
      cta: string;
      phone: string;
    };
    pipeline: {
      badge: string;
      title: string;
      body: string;
      export: string;
      columns: Array<{ title: string; count: number; items: string[] }>;
    };
  };
  mock: {
    prospectsTitle: string;
    prospectsCount: string;
    hotFilter: string;
    aiScoring: string;
    mapSearch: string;
    filters: string;
    noWebsite: string;
    mobileFailing: string;
    radius: string;
    zoneLabel: string;
    businessesFound: string;
    auditLow: string;
    emailDraft: string;
    emailTo: string;
    emailSubject: string;
    emailBodyBefore: string;
    emailHighlight: string;
    emailBodyAfter: string;
    generated: string;
    demoAttached: string;
    appUrl: string;
    prospects: Array<{
      id: string;
      initials: string;
      name: string;
      sub: string;
      score: string;
      kind: "hot" | "warm" | "cold";
    }>;
    badgeHot: string;
    badgeWarm: string;
    badgeCold: string;
    productPreview: string;
  };
  video: {
    eyebrow: string;
    title: string;
    sub: string;
    live: string;
    duration: string;
    stamp: string;
  };
  compare: {
    eyebrow: string;
    title: string;
    sub: string;
    manual: string;
    product: string;
    rows: Array<{ feature: string; manual: string; product: string }>;
  };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    planName: string;
    planSub: string;
    launching: string;
    perMonth: string;
    features: string[];
    footnote: string;
    caveat: string;
    trustSsl: string;
    trustGdpr: string;
    trustLang: string;
    trustPayments: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: Array<{ q: string; a: string }>;
  };
  finalCta: {
    pill: string;
    title: string;
    sub: string;
  };
  footer: {
    tagline: string;
    product: string;
    legal: string;
    legalIndex: string;
    contact: string;
    terms: string;
    privacy: string;
    gdpr: string;
    cookies: string;
    status: string;
    changelog: string;
    copyright: string;
    gdprReady: string;
    stripeSecured: string;
  };
  legal: {
    placeholder: string;
  };
};
