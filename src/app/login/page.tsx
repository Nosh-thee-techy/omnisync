import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/components/auth/auth-error";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { auth0 } from "@/lib/auth0";
import { safeReturnTo } from "@/lib/return-to";

export const metadata = { title: "Log in · OmniSync" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);

  // Already signed in — no reason to show a login screen.
  if (await auth0.getSession()) {
    redirect(returnTo);
  }

  return (
    <AuthLayout
      title="Log in to OmniSync"
      subtitle="We'll email you a one-time code — no password to remember."
      footer={
        <>
          New here?{" "}
          <Link
            href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <AuthError
        message={
          typeof params.error === "string" ? params.error : undefined
        }
      />
      <AuthForm mode="login" returnTo={returnTo} />
    </AuthLayout>
  );
}
