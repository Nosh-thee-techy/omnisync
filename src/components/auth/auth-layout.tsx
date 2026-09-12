import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The right-hand panel is supporting evidence, not instruction — it shows the
 * thing the product actually does rather than describing it. Hidden below lg,
 * and hidden from assistive tech, since the form is the whole job on mobile.
 */
function ProductProof() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden border-l border-border bg-muted/40 lg:block"
    >
      <div className="flex h-full flex-col justify-center gap-8 px-16 py-24">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs tracking-tight text-muted-foreground">
            LIVE · 00:09:42 · Q3 partner sync
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              de-DE · Lena Fischer
            </span>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Wir müssen den Vertrag bis Freitag aktualisieren.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 border-l-2 border-foreground/15 pl-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              → en-US
            </span>
            <p className="text-[15px] leading-relaxed text-foreground">
              We need to update the contract by Friday.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <span className="font-mono text-[11px] tracking-tight text-muted-foreground">
            ACTION ITEM · PROPOSED
          </span>
          <p className="mt-2 text-[15px] font-medium leading-snug text-card-foreground">
            Update the partner contract and notify legal
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="text-card-foreground">Lena Fischer</dd>
            <dt className="text-muted-foreground">Due</dt>
            <dd className="text-card-foreground">Fri 18 Sep</dd>
          </dl>
          <div className="mt-5 flex gap-2">
            <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              Approve
            </span>
            <span className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Reassign
            </span>
          </div>
        </div>

        <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          OmniSync listens across languages, pulls out the commitments, and hands
          them to your team before the call ends.
        </p>
      </div>
    </aside>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-dvh flex-col px-6 py-10 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          OmniSync
        </Link>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm py-12">
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Codes are issued and verified by Auth0. OmniSync never stores a password.
        </p>
      </div>

      <ProductProof />
    </div>
  );
}
