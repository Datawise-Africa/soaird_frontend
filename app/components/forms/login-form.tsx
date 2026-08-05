import { useForm } from 'react-hook-form';
import {
  useNavigate,
  useRevalidator,
  useSearchParams,
  Link,
} from 'react-router';
import { ArrowRight, LogIn } from 'lucide-react';
import { loginResolver, type LoginInput } from '~/lib/schema';
import { useLogin } from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormPasswordField } from '~/components/form-fields';

export function LoginForm() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams();
  const login = useLogin();

  // The protected layout parks the attempted URL here so sign-in returns to it.
  const redirectTo = searchParams.get('redirectTo') || '/overview';

  const form = useForm<LoginInput>({
    resolver: loginResolver,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const session = await login.mutateAsync(data);
      const name =
        [session.user.first_name, session.user.last_name]
          .filter(Boolean)
          .join(' ') || session.user.email;
      toastUtils.success('Welcome back', `Signed in as ${name}.`);
      // Re-run the root loader so `useAuth()` sees the new session BEFORE we land
      // on the guarded route — a plain navigate() won't re-run an already-matched
      // root loader, so the guard would otherwise bounce us back to login.
      await revalidator.revalidate();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toastUtils.error(
        'Sign in failed',
        extractError(error, 'Could not sign you in. Please try again.')
      );
    }
  };

  return (
    <div className="auth-form">
      <p className="overline">Welcome back</p>
      <h2>Sign in to your research workspace</h2>
      <p>
        Continue your dataset assessments, evidence reviews and research
        analysis.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <FormTextField
            control={form.control}
            name="email"
            label="Email address"
            type="email"
            placeholder="name@organization.org"
            autoComplete="email"
            required
          />
          <FormPasswordField
            control={form.control}
            name="password"
            label="Password"
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            className="button primary full"
            disabled={login.isPending}
          >
            <LogIn className="h-4 w-4" />
            {login.isPending ? 'Signing in…' : 'Sign in'}
            {!login.isPending && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <p className="auth-help">
        No account?{' '}
        <Link to="/auth/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}