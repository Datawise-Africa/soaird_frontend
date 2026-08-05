/**
 * Schema.org JSON-LD builders for Datawise Africa.
 */
import { env } from '~/lib/env';

const SITE_NAME = 'Datawise Africa';
const SITE_URL = env.VITE_SITE_URL;
const LOGO_URL = `${SITE_URL}/assets/datawise-logo-dark.png`;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: ['https://www.linkedin.com/company/datawise-africa'],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export interface SoftwareApplicationLike {
  name?: string;
  description: string;
  category?: string;
}

/**
 * Worked example of a second JSON-LD type — pass it to `generateSEOTags` via
 * the `jsonLd` key. Kept in the template so forks extend this file instead of
 * hand-rolling structured data from scratch.
 */
export function softwareApplicationSchema(app: SoftwareApplicationLike) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name ?? SITE_NAME,
    description: app.description,
    url: SITE_URL,
    applicationCategory: app.category ?? 'BusinessApplication',
    operatingSystem: 'Web',
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: LOGO_URL },
  };
}
