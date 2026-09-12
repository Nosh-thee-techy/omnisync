"use client";

import { passwordless } from "@auth0/nextjs-auth0/client";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// The tenant's database connection. OTP codes are issued against it, so new
// users land in the same directory as password users.
const CONNECTION = "Username-Password-Authentication";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function errorMessage(err: unknown, fallback: string): string {
  const e = err as { error_description?: string; error?: string };
  return e?.error_description ?? e?.error ?? fallback;
}

export function AuthForm({
  mode,
  returnTo,
}: {
  mode: "login" | "signup";
  returnTo: string;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [authSession, setAuthSession] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const isSignup = mode === "signup";

  // Auth0 answers the challenge with 200 whether or not the account exists, so
  // that it can't be used to enumerate users. A wrong email surfaces later, as a
  // failed code.
  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { authSession: session } = await passwordless.challengeWithEmail({
        email,
        connection: CONNECTION,
        allowSignup: isSignup,
      });

      setAuthSession(session);
      setOtp("");
    } catch (err) {
      setError(errorMessage(err, "Could not send a code. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!authSession) return;

    setBusy(true);
    setError(null);

    try {
      // On success the SDK writes the session itself — which runs it through
      // the Prisma session store — so a full page load picks it up.
      await passwordless.loginWithOtp({ authSession, otp });
      window.location.assign(returnTo);
    } catch (err) {
      setError(
        errorMessage(
          err,
          isSignup
            ? "That code didn't work. Request a new one."
            : "That code didn't work, or there's no OmniSync account for this email.",
        ),
      );
      setBusy(false);
    }
  }

  async function resend() {
    await requestCode();
    setResent(true);
  }

  const googleHref = `/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(returnTo)}${
    isSignup ? "&screen_hint=signup" : ""
  }`;

  if (authSession) {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="otp" className="text-sm font-medium text-foreground">
            Enter the 6-digit code
          </label>
          <p className="text-sm text-muted-foreground">
            Sent to <span className="text-foreground">{email}</span>.
          </p>
          <Input
            id="otp"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            placeholder="000000"
            className="h-11 text-center font-mono text-lg tracking-[0.4em]"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={busy || otp.length < 6}
          className="h-10 w-full"
        >
          {busy ? "Verifying…" : isSignup ? "Create account" : "Log in"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setAuthSession(null);
              setError(null);
              setResent(false);
            }}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Use a different email
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            {resent ? "Code resent" : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={requestCode} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            className="h-10"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="h-10 w-full">
          {busy ? "Sending code…" : "Continue with email"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* A real <a>: this navigates, so it should be a link, not a button. */}
      <a
        href={googleHref}
        className={buttonVariants({
          variant: "outline",
          className: "h-10 w-full",
        })}
      >
        <GoogleMark />
        Continue with Google
      </a>
    </div>
  );
}
