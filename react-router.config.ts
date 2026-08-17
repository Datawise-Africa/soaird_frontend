import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  // Pre-render static public pages for fast TTFB + better SEO.
  // Only routes whose HTML is real without a client fetch belong here.
  // `/products` and `/categories` load their data from React Query at runtime,
  // so prerendering them would ship a loading spinner as the crawlable body.
  prerender: ['/robots.txt', '/sitemap.xml'],
} satisfies Config;
