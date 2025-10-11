import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { authClient } from '../auth-client.ts';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    viewBox="-3 0 262 262"
    {...props}
  >
    <path
      fill="#4285F4"
      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
    ></path>
    <path
      fill="#34A853"
      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
    ></path>
    <path
      fill="#FBBC05"
      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
    ></path>
    <path
      fill="#EB4335"
      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
    ></path>
  </svg>
);

export default function Login() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryError = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('error');
  }, [location.search]);

  useEffect(() => {
    if (!queryError) return;
    const messageMap: Record<string, string> = {
      access_denied: 'Google declined the request. Please try again.',
      cancelled: 'Sign in was cancelled. Give it another go.',
    };
    setErrorMessage(
      messageMap[queryError] ??
        'We could not complete the Google sign-in. Please try again.',
    );
  }, [queryError]);

  const handleGoogleSignIn = useCallback(async () => {
    if (isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL:
          typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined,
        errorCallbackURL:
          typeof window !== 'undefined'
            ? `${window.location.origin}/login?error=access_denied`
            : undefined,
      });
    } catch (error) {
      console.error('Google sign-in failed', error);
      setErrorMessage(
        'Something went wrong while starting Google sign-in. Please try again.',
      );
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="bg-background text-foreground">
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4"
        style={{ minHeight: 'max(884px, 100dvh)' }}
      >
        <div className="w-full max-w-sm text-center">
          <header className="mb-12">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Thing
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              A space to record your precious moments.
            </p>
          </header>
          <main className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="border-border bg-card text-card-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex h-12 w-full items-center justify-center gap-x-2 rounded-lg border px-5 font-semibold shadow-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="size-6" />
              <span>{isLoading ? 'Redirecting…' : 'Sign in with Google'}</span>
            </button>
            {errorMessage ? (
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </main>
          <footer className="mt-24">
            <p className="text-muted-foreground text-center text-xs">
              By continuing, you agree to our{' '}
              <a
                className="text-primary font-medium hover:underline"
                href="/terms"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                className="text-primary font-medium hover:underline"
                href="/privacy"
              >
                Privacy Policy
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
