import type { Route } from './+types/robots.txt';
import { env } from '~/lib/env';

export const loader = ({ request }: Route.LoaderArgs) => {
  const { origin } = new URL(request.url);
  const noIndex = env.VITE_NOINDEX;

  const body = noIndex
    ? `User-agent: *\nDisallow: /\n`
    : [
        'User-agent: *',
        'Allow: /',
        '',
        'Disallow: /.well-known/',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
