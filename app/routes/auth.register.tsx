import { generateSEOTags } from '~/lib/utils/seo';
import { RegisterForm } from '~/components/forms';
import { AuthStory } from '~/components/auth-story';

export function meta() {
  return generateSEOTags({
    title: 'Create Account | SOAIRD App',
    description:
      'Create an account to collaborate on AI-ready dataset research across Africa.',
    url: '/auth/register',
    noIndex: true,
  });
}

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <AuthStory />
      <section className="auth-form-side">
        <RegisterForm />
      </section>
    </main>
  );
}