"use client";

import { useUser } from "@auth0/nextjs-auth0";

export function AuthStatus() {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Checking session…</span>;
  }

  if (error) {
    return <span className="text-sm text-destructive">{error.message}</span>;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
      >
        Log in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{user.email ?? user.name}</span>
      <a href="/dashboard" className="font-medium hover:underline">
        Dashboard
      </a>
      <a
        href="/auth/logout"
        className="rounded-md border px-3 py-1.5 font-medium hover:bg-muted"
      >
        Log out
      </a>
    </div>
  );
}
