import type { SiteContent, SiteGeneratorInput } from "@/lib/site-generator/types";

interface RenderSiteHtmlOptions {
  input: SiteGeneratorInput;
  content: SiteContent;
  mapsUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function accentForType(type: string | null): { primary: string; secondary: string; gradient: string } {
  const key = (type ?? "").toLowerCase();

  if (key.includes("restaurant") || key.includes("food") || key.includes("cafe") || key.includes("bakery")) {
    return {
      primary: "#c2410c",
      secondary: "#ea580c",
      gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fdba74 100%)",
    };
  }

  if (key.includes("hair") || key.includes("beauty") || key.includes("spa")) {
    return {
      primary: "#9d174d",
      secondary: "#db2777",
      gradient: "linear-gradient(135deg, #831843 0%, #db2777 50%, #fbcfe8 100%)",
    };
  }

  if (key.includes("gym") || key.includes("sport")) {
    return {
      primary: "#047857",
      secondary: "#10b981",
      gradient: "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #6ee7b7 100%)",
    };
  }

  if (key.includes("lodging") || key.includes("hotel")) {
    return {
      primary: "#1e40af",
      secondary: "#3b82f6",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)",
    };
  }

  return {
    primary: "#0f766e",
    secondary: "#14b8a6",
    gradient: "linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #99f6e4 100%)",
  };
}

function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function renderHours(hours: string[] | null): string {
  if (!hours?.length) {
    return "";
  }

  const items = hours.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  return `
    <section class="section" id="horaires">
      <div class="container">
        <h2>Horaires</h2>
        <ul class="hours">${items}</ul>
      </div>
    </section>`;
}

function renderRating(rating: number | null, count: number | null): string {
  if (rating === null) {
    return "";
  }

  const reviewLabel = count !== null && count > 0 ? ` · ${count} avis Google` : "";
  return `<p class="rating">${escapeHtml(String(rating))}★${escapeHtml(reviewLabel)}</p>`;
}

export function renderSiteHtml({ input, content, mapsUrl }: RenderSiteHtmlOptions): string {
  const accent = accentForType(input.type);
  const name = escapeHtml(input.name);
  const tagline = escapeHtml(content.tagline);
  const about = escapeHtml(content.about);
  const ctaText = escapeHtml(content.ctaText);
  const address = input.address ? escapeHtml(input.address) : "";
  const phone = input.phone ? escapeHtml(input.phone) : "";
  const phoneHref = input.phone ? formatPhoneHref(input.phone) : "";
  const mapsHref = escapeHtml(mapsUrl);
  const typeLabel = escapeHtml((input.type ?? "établissement").replace(/_/g, " "));

  const servicesHtml = content.services
    .map(
      (service, index) => `
        <article class="card">
          <span class="card-num">${index + 1}</span>
          <p>${escapeHtml(service)}</p>
        </article>`,
    )
    .join("");

  const ctaBlock = input.phone
    ? `<a class="btn btn-primary" href="${phoneHref}">${ctaText}</a>`
    : `<a class="btn btn-primary" href="${mapsHref}" target="_blank" rel="noopener noreferrer">${ctaText}</a>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name}</title>
  <meta name="description" content="${tagline}" />
  <style>
    :root {
      --primary: ${accent.primary};
      --secondary: ${accent.secondary};
      --text: #0f172a;
      --muted: #64748b;
      --bg: #f8fafc;
      --card: #ffffff;
      --radius: 16px;
      --shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.6;
    }
    .demo-banner {
      background: #fef3c7;
      color: #92400e;
      text-align: center;
      padding: 0.55rem 1rem;
      font-size: 0.82rem;
      font-weight: 600;
      border-bottom: 1px solid #fde68a;
    }
    .hero {
      background: ${accent.gradient};
      color: white;
      padding: 4rem 1.25rem 5rem;
      text-align: center;
    }
    .hero-inner { max-width: 720px; margin: 0 auto; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.78rem;
      text-transform: capitalize;
      letter-spacing: 0.04em;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: clamp(2rem, 6vw, 3.2rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 0.75rem;
    }
    .tagline {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      opacity: 0.95;
      max-width: 560px;
      margin: 0 auto 1.25rem;
    }
    .rating { opacity: 0.9; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .btn {
      display: inline-block;
      text-decoration: none;
      border-radius: 999px;
      padding: 0.85rem 1.6rem;
      font-weight: 600;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-primary {
      background: white;
      color: var(--primary);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .btn-primary:hover { transform: translateY(-1px); }
    .btn-outline {
      border: 2px solid var(--primary);
      color: var(--primary);
      background: transparent;
    }
    .section { padding: 3.5rem 1.25rem; }
    .container { max-width: 960px; margin: 0 auto; }
    h2 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
    }
    .about { color: var(--muted); font-size: 1.05rem; max-width: 680px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 1.25rem;
      box-shadow: var(--shadow);
      border: 1px solid #e2e8f0;
    }
    .card-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 12%, white);
      color: var(--primary);
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }
    .contact {
      background: white;
      border-top: 1px solid #e2e8f0;
    }
    .contact-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .contact-item {
      background: var(--bg);
      border-radius: var(--radius);
      padding: 1rem 1.1rem;
      border: 1px solid #e2e8f0;
    }
    .contact-item strong {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 0.35rem;
    }
    .contact-item a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .hours {
      list-style: none;
      margin-top: 1rem;
      background: white;
      border-radius: var(--radius);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .hours li {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.95rem;
    }
    .hours li:last-child { border-bottom: none; }
    footer {
      text-align: center;
      padding: 2rem 1rem 2.5rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    @media (min-width: 640px) {
      .contact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="demo-banner">Maquette de démonstration — site proposé, non publié officiellement</div>
  <header class="hero">
    <div class="hero-inner">
      <span class="badge">${typeLabel}</span>
      <h1>${name}</h1>
      <p class="tagline">${tagline}</p>
      ${renderRating(input.googleRating, input.googleReviewCount)}
      ${ctaBlock}
    </div>
  </header>
  <section class="section">
    <div class="container">
      <h2>À propos</h2>
      <p class="about">${about}</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="container">
      <h2>Ce que nous proposons</h2>
      <div class="grid">${servicesHtml}</div>
    </div>
  </section>
  ${renderHours(input.enrichment.openingHours)}
  <section class="section contact" id="contact">
    <div class="container">
      <h2>Nous trouver</h2>
      <div class="contact-grid">
        ${
          address
            ? `<div class="contact-item"><strong>Adresse</strong><a href="${mapsHref}" target="_blank" rel="noopener noreferrer">${address}</a></div>`
            : ""
        }
        ${
          phone
            ? `<div class="contact-item"><strong>Téléphone</strong><a href="${phoneHref}">${phone}</a></div>`
            : ""
        }
        <div class="contact-item"><strong>Itinéraire</strong><a href="${mapsHref}" target="_blank" rel="noopener noreferrer">Voir sur Google Maps</a></div>
      </div>
      <p style="margin-top:1.5rem">${ctaBlock}</p>
    </div>
  </section>
  <footer>© ${new Date().getFullYear()} ${name} — maquette vitrine</footer>
</body>
</html>`;
}
