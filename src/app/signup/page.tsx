import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/components/auth/auth-error";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { auth0 } from "@/lib/auth0";
import { safeReturnTo } from "@/lib/return-to";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Sign up · OmniSync" };

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);

  if (await auth0.getSession()) {
    redirect(returnTo);
  }

  return (
    <AuthLayout
      title="Create your OmniSync account"
      subtitle="Turn multilingual calls into commitments your team can act on. We'll email you a code to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Log in
          </Link>
        </>
      }
    >
      <AuthError
        message={
          typeof params.error === "string" ? params.error : undefined
        }
      />
      <AuthForm mode="signup" returnTo={returnTo} />
    </AuthLayout>
  );
}
