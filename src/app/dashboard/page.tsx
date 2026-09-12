import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/login?returnTo=/dashboard");
  }

  // The row mirrored from Auth0 when this session was first written.
  const user = await prisma.user.findUnique({
    where: { auth0Sub: session.user.sub },
    include: {
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, expiresAt: true },
      },
    },
  });

  const meetings = await prisma.meeting.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
    include: { _count: { select: { actionItems: true, participants: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email ?? session.user.email ?? session.user.name}
          </p>
        </div>
        <a
          href="/auth/logout"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Log out
        </a>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-md border p-4 text-sm">
          <dt className="text-muted-foreground">Auth0 sub</dt>
          <dd className="font-mono text-xs break-all">{session.user.sub}</dd>
          <dt className="text-muted-foreground">Local user id</dt>
          <dd className="font-mono text-xs break-all">{user?.id ?? "—"}</dd>
          <dt className="text-muted-foreground">Last login</dt>
          <dd>{user?.lastLoginAt?.toLocaleString() ?? "—"}</dd>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          Active sessions ({user?.sessions.length ?? 0})
        </h2>
        <ul className="mt-3 divide-y rounded-md border text-sm">
          {user?.sessions.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <p className="font-mono text-xs break-all">{s.id}</p>
              <p className="text-muted-foreground">
                started {s.createdAt.toLocaleString()} · expires{" "}
                {s.expiresAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          Recent meetings
        </h2>
        <ul className="mt-3 divide-y rounded-md border text-sm">
          {meetings.length === 0 && (
            <li className="px-4 py-6 text-muted-foreground">
              No meetings yet — run <code>npm run db:seed</code>.
            </li>
          )}
          {meetings.map((meeting) => (
            <li key={meeting.id} className="px-4 py-3">
              <p className="font-medium">{meeting.title}</p>
              <p className="text-muted-foreground">
                {meeting._count.participants} participants ·{" "}
                {meeting._count.actionItems} action items · {meeting.status}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
