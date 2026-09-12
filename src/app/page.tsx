import Link from "next/link";

import {
  AppMarkRow,
  DESTINATION_APPS,
  MEETING_APPS,
} from "@/components/landing/app-marks";
import { MeetingPreview } from "@/components/landing/meeting-preview";

export const metadata = {
  title: "OmniSync | Meetings, in sync",
  description:
    "OmniSync listens to multilingual meetings, extracts the commitments as they are made, and turns the ones your team approves into tracked work.",
};

const stages = [
  {
    step: "01",
    label: "In the room",
    title: "Listens in every language on the call",
    body: "Audio streams in from your meeting app and comes back as transcript blocks with the spoken language detected, then rendered in the language each attendee reads.",
    detail: "Sub-second transcription · language detected per block",
  },
  {
    step: "02",
    label: "As it happens",
    title: "Surfaces commitments for approval, mid-conversation",
    body: "When someone commits to something, it appears as a card inside the meeting — pre-filled with the owner, the due date, and the line that prompted it. One click to approve, edit, or reassign.",
    detail: "Owner · due date · source quote",
  },
  {
    step: "03",
    label: "After the call",
    title: "Turns approvals into work in your own tools",
    body: "Approved items become issues, emails and posts in the systems your team already lives in. Background research requested during the call arrives with them.",
    detail: "Dispatched on approval, not on a nightly batch",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-tight">
            OmniSync
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-indigo-700">
                For teams that meet across borders
              </p>
              <h1 className="mt-5 max-w-xl text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-zinc-900 sm:text-[52px]">
                Nothing agreed on a call should be lost in translation.
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-600">
                OmniSync listens to multilingual meetings, extracts the
                commitments as they are made, and turns the ones your team
                approves into tracked work — before the call ends.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Log in
                </Link>
              </div>
              <div className="mt-14">
                <AppMarkRow apps={MEETING_APPS} label="Joins your calls in" />
              </div>
            </div>

            <MeetingPreview />
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-24">
            <h2 className="max-w-2xl text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900">
              From spoken word to tracked work, in three stages
            </h2>
            <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
              {stages.map((stage) => (
                <div
                  key={stage.step}
                  className="border-t border-zinc-300 pt-6 md:pt-7"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-indigo-700">
                      {stage.step}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {stage.label}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-zinc-900">
                    {stage.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
                    {stage.body}
                  </p>
                  <p className="mt-4 font-mono text-xs leading-relaxed text-zinc-500">
                    {stage.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              <h2 className="max-w-lg text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900">
                The follow-through lands where your team already works
              </h2>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-zinc-600">
                An approved commitment does not become a line in a document
                nobody reopens. It becomes an issue with an owner, an email in
                the thread it belongs to, or a summary posted in the channel —
                in the language each person reads.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-8 lg:pt-2">
              <AppMarkRow apps={DESTINATION_APPS} label="Delivers into" />
              <p className="max-w-md border-t border-zinc-200 pt-6 text-[15px] leading-relaxed text-zinc-600">
                Every dispatch is traceable back to the moment on the call that
                created it, including the original utterance and who approved
                it.
              </p>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center lg:py-24">
            <h2 className="mx-auto max-w-2xl text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900">
              Put your next cross-border meeting to work
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-600">
              Connect the meeting app your team already uses and see the
              commitments as they are made.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            OmniSync
          </span>
          <p className="text-sm text-zinc-500">
            Product names and logos shown are trademarks of their respective
            owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
