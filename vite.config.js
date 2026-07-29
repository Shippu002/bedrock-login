import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getSitemapRoutes } from "./src/services/seoRoutes.js";


function bedrockSitemapPlugin() {
  return {
    name: "bedrock-sitemap",
    apply: "build",
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      const urls = getSitemapRoutes()
        .map(
          (route) =>
            `  <url>\n` +
            `    <loc>${route.loc}</loc>\n` +
            `    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${route.changefreq}</changefreq>\n` +
            `    <priority>${route.priority}</priority>\n` +
            `  </url>`,
        )
        .join("\n");

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${urls}\n` +
        `</urlset>\n`;

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), bedrockSitemapPlugin()],
});
