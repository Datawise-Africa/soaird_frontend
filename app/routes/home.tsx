import { redirect } from 'react-router';
import type { Route } from './+types/home';
import { getAuthFromRequest } from '~/lib/auth/session';

export function loader({ request }: Route.LoaderArgs) {
  const { isAuthenticated } = getAuthFromRequest(request);
  throw redirect(isAuthenticated ? '/overview' : '/auth/login');
}

export default function HomePage() {
  return null;
}