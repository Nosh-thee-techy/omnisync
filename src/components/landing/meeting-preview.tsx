/**
 * The hero's product panel. It shows the actual mechanism — a German utterance
 * resolving into an English commitment with an owner and a due date — rather
 * than describing it. The content mirrors the seeded example in prisma/seed.ts
 * so the page never claims capability the schema does not model.
 */
export function MeetingPreview() {
  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_32px_-12px_rgba(24,24,27,0.12)]">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-500/50" />
            <span className="relative inline-flex size-2 rounded-full bg-indigo-600" />
          </span>
          <span className="font-mono text-xs tracking-tight text-zinc-600">
            Q3 partner sync
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-zinc-500">
          00:09:42
        </span>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-zinc-500">
            de-DE · Lena Fischer
          </span>
          <p className="text-[15px] leading-relaxed text-zinc-500">
            Wir müssen den Vertrag bis Freitag aktualisieren.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 border-l-2 border-indigo-600 pl-4">
          <span className="font-mono text-[11px] text-zinc-500">en-US</span>
          <p className="text-[15px] leading-relaxed text-zinc-900">
            We need to update the contract by Friday.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Action item · awaiting approval
          </span>
          <p className="mt-2 text-[15px] font-medium leading-snug text-zinc-900">
            Update the partner contract and notify legal
          </p>
          <dl className="mt-3.5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[13px]">
            <dt className="text-zinc-500">Owner</dt>
            <dd className="text-zinc-800">Lena Fischer</dd>
            <dt className="text-zinc-500">Due</dt>
            <dd className="text-zinc-800">Friday 18 September</dd>
          </dl>
          <div className="mt-4 flex gap-2">
            <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
              Approve
            </span>
            <span className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
              Reassign
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
