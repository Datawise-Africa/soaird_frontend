import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // You can log to error reporting service here (e.g., Sentry)
    // if (import.meta.env.VITE_SENTRY_DSN) {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try again or contact
                support if the problem persists.
              </CardDescription>
            </CardHeader>

            {import.meta.env.DEV && this.state.error && (
              <CardContent>
                <div className="rounded-md border border-border bg-muted p-4 text-sm">
                  <p className="mb-2 font-semibold text-destructive">Error:</p>
                  <pre className="wrap-break-word whitespace-pre-wrap text-foreground">
                    {this.state.error.message}
                  </pre>

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p className="mt-4 mb-2 font-semibold text-destructive">
                        Component Stack:
                      </p>
                      <pre className="wrap-break-word max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              <Button
                onClick={() => (globalThis.window.location.href = '/')}
                variant="outline"
              >
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}