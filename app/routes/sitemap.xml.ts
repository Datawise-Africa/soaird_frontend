import type { Route } from './+types/sitemap.xml';

type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

interface SitemapRoute {
  path: string;
  priority: number;
  changefreq: ChangeFreq;
}

/**
 * Static public routes only. Admin actions (`/new`, `/edit`) and dynamic
 * detail pages (`:id`) are excluded — emit those from a separate
 * sitemap-index sourced from the API once data volume warrants it.
 */
const routes: SitemapRoute[] = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const loader = ({ request }: Route.LoaderArgs) => {
  const { origin } = new URL(request.url);
  const lastmod = new Date().toISOString();

  const urls = routes
    .map((r) => {
      const loc = escapeXml(`${origin}${r.path}`);
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};