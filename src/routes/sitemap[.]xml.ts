import { createFileRoute } from "@tanstack/react-router";

// TODO: Set this to your real domain once you have one registered.
// e.g. "https://yourdomain.co.uk"
const BASE_URL = "";

interface Entry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const ENTRIES: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/catalogue", changefreq: "weekly", priority: "0.9" },
  { path: "/chat", changefreq: "monthly", priority: "0.8" },
  { path: "/panel", changefreq: "monthly", priority: "0.8" },
  { path: "/compliance", changefreq: "monthly", priority: "0.8" },
  { path: "/pipeline", changefreq: "monthly", priority: "0.7" },
  { path: "/simulator", changefreq: "monthly", priority: "0.6" },
  { path: "/news", changefreq: "hourly", priority: "0.9" },
  { path: "/attachments", changefreq: "monthly", priority: "0.6" },
  { path: "/cart", changefreq: "monthly", priority: "0.6" },
  { path: "/partner-pricing", changefreq: "monthly", priority: "0.5" },
  { path: "/licensing", changefreq: "monthly", priority: "0.5" },
  { path: "/finance", changefreq: "monthly", priority: "0.5" },
  { path: "/migration", changefreq: "yearly", priority: "0.4" },
  { path: "/settings", changefreq: "yearly", priority: "0.4" },
  { path: "/access", changefreq: "yearly", priority: "0.4" },
  { path: "/legal", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/privacy", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/terms", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/dpa", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/sla", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/security", changefreq: "yearly", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = ENTRIES.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});