import { generateSEOTags } from '~/lib/utils/seo';
import { LoginForm } from '~/components/forms';
import { AuthStory } from '~/components/auth-story';

export function meta() {
  return generateSEOTags({
    title: 'Sign In | SOAIRD App',
    description:
      'Sign in to continue AI-ready dataset assessment, evidence review and research analytics.',
    url: '/auth/login',
    noIndex: true,
  });
}

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <AuthStory />
      <section className="auth-form-side">
        <LoginForm />
      </section>
    </main>
  );
}