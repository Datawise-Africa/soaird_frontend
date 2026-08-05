import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router';
import { ArrowRight, UserPlus } from 'lucide-react';
import { registerResolver, type RegisterInput } from '~/lib/schema';
import { useRegister } from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormPasswordField } from '~/components/form-fields';

export function RegisterForm() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm<RegisterInput>({
    resolver: registerResolver,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirm: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await register.mutateAsync(data);
      toastUtils.success(
        'Account created',
        result.verification_required
          ? 'A research administrator must verify it before your first sign in.'
          : 'You can now sign in.'
      );
      navigate('/auth/login?registered=1', { replace: true });
    } catch (error) {
      toastUtils.error(
        'Registration failed',
        extractError(error, 'Could not create your account. Please try again.')
      );
    }
  };

  return (
    <div className="auth-form">
      <p className="overline">Join the research network</p>
      <h2>Create your SOAIRD account</h2>
      <p>
        Use your work email. Your administrator may need to verify the account
        before your first sign in.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="first_name"
              label="First name"
              placeholder="Your first name"
              autoComplete="given-name"
              required
            />
            <FormTextField
              control={form.control}
              name="last_name"
              label="Last name"
              placeholder="Your last name"
              autoComplete="family-name"
              required
            />
          </div>
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
              autoComplete="new-password"
              required
            />
            <FormPasswordField
              control={form.control}
              name="password_confirm"
              label="Confirm password"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              className="button primary full"
              disabled={register.isPending}
            >
              <UserPlus className="h-4 w-4" />
              {register.isPending ? 'Creating account…' : 'Create account'}
              {!register.isPending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </Form>

        <p className="auth-help">
          Already registered?{' '}
          <Link to="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
    </div>
  );
}