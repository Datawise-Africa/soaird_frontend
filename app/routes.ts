import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
import { authRoutes } from './auth.routes';
import { researchRoutes } from './research.routes';

export default [
  index('routes/home.tsx'),
  ...authRoutes,

  layout('components/dashboard-layout.tsx', researchRoutes),

  route('sitemap.xml', 'routes/sitemap.xml.ts'),
  route('robots.txt', 'routes/robots.txt.ts'),
  route(
    '.well-known/appspecific/com.chrome.devtools.json',
    'routes/[.]well-known.appspecific.[com.chrome.devtools.json].ts'
  ),
] satisfies RouteConfig;