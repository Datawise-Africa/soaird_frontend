import { route } from '@react-router/dev/routes';

export const authRoutes = [
  route('auth/login', 'routes/auth.login.tsx'),
  route('auth/register', 'routes/auth.register.tsx'),
];
