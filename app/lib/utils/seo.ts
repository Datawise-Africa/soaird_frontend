import { env } from '~/lib/env';

/**
 * Configuration object for SEO metadata generation.
 */
export interface SEOConfig {
  title: string;
  description: string;
  /** Absolute or relative URL used for canonical + og:url. */
  url?: string;
  image?: string;
  type?: string;
  keywords?: string;
  /** Force noindex for this route. */
  noIndex?: boolean;
  /** JSON-LD objects to emit as <script type="application/ld+json"> tags. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const SITE_NAME = 'Datawise Africa';
const TWITTER_HANDLE = '@datawise_AFR';

const baseUrl = env.VITE_SITE_URL;

const defaultImage = `${baseUrl}/assets/datawise-logo-dark.png`;

/**
 * Strip tracking query params and trailing slash for canonical URLs.
 */
function canonicalize(url: string): string {
  try {
    const u = new URL(url);
    const strip = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'gclid',
      'fbclid',
    ];
    strip.forEach((k) => u.searchParams.delete(k));
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function generateSEOTags(config: SEOConfig) {
  const {
    title,
    description,
    url,
    image = defaultImage,
    type = 'website',
    keywords,
    noIndex,
    jsonLd,
  } = config;

  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const rawUrl = url
    ? url.startsWith('http')
      ? url
      : `${baseUrl}${url}`
    : baseUrl;
  const fullUrl = canonicalize(rawUrl);
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

  const shouldNoIndex = noIndex || env.VITE_NOINDEX;

  const jsonLdTags = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((obj) => ({
        'script:ld+json': obj,
      }))
    : [];

  return [
    { title: fullTitle },
    { name: 'description', content: description },
    ...(keywords ? [{ name: 'keywords', content: keywords }] : []),

    { tagName: 'link', rel: 'canonical', href: fullUrl },

    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:url', content: fullUrl },
    { property: 'og:image', content: fullImageUrl },
    { property: 'og:image:secure_url', content: fullImageUrl },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { property: 'og:site_name', content: 'Datawise Africa - Website' },
    { property: 'og:locale', content: 'en_US' },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: TWITTER_HANDLE },
    { name: 'twitter:creator', content: TWITTER_HANDLE },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: fullImageUrl },
    { name: 'twitter:image:alt', content: title },
    { name: 'twitter:domain', content: new URL(baseUrl).hostname },

    { name: 'author', content: SITE_NAME },
    {
      name: 'robots',
      content: shouldNoIndex ? 'noindex, nofollow' : 'index, follow',
    },

    ...jsonLdTags,
  ];
}
