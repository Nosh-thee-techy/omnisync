import type {
  LogoutToken,
  SessionData,
  SessionDataStore,
} from "@auth0/nextjs-auth0/types";

import { prisma } from "@/lib/prisma";
import { decryptSession, encryptSession } from "@/lib/session-crypto";

// Must match the values passed to Auth0Client in src/lib/auth0.ts, so the row's
// expiry and the cookie's expiry stay in step.
export const SESSION_ABSOLUTE_DURATION_SECONDS = 60 * 60 * 24 * 3; // 3 days
export const SESSION_INACTIVITY_DURATION_SECONDS = 60 * 60 * 24; // 1 day

/**
 * The row expires at the rolling inactivity window, but never later than the
 * absolute ceiling measured from when the session was first created.
 */
function expiryFor(session: SessionData): Date {
  const now = Date.now();
  const rolling = now + SESSION_INACTIVITY_DURATION_SECONDS * 1000;
  const absolute =
    session.internal.createdAt * 1000 +
    SESSION_ABSOLUTE_DURATION_SECONDS * 1000;

  return new Date(Math.min(rolling, absolute));
}

function userFields(session: SessionData) {
  const user = session.user;

  return {
    email: typeof user.email === "string" ? user.email : null,
    emailVerified: user.email_verified === true,
    name: typeof user.name === "string" ? user.name : null,
    nickname: typeof user.nickname === "string" ? user.nickname : null,
    picture: typeof user.picture === "string" ? user.picture : null,
    ...(typeof user.locale === "string" ? { locale: user.locale } : {}),
  };
}

export const prismaSessionStore: SessionDataStore = {
  async get(id) {
    const row = await prisma.session.findUnique({ where: { id } });

    if (!row) {
      return null;
    }

    if (row.expiresAt <= new Date()) {
      await prisma.session.deleteMany({ where: { id } });
      return null;
    }

    return decryptSession<SessionData>(row.data);
  },

  /**
   * Called on login and whenever the session materially changes (a token
   * refresh, for example). The first write for an id is also where we mirror
   * the Auth0 profile into our own `User` table.
   */
  async set(id, session) {
    const existing = await prisma.session.findUnique({
      where: { id },
      select: { userId: true },
    });

    const data = encryptSession(session);
    const expiresAt = expiryFor(session);

    if (existing) {
      await prisma.session.update({
        where: { id },
        data: { data, expiresAt, sid: session.internal.sid },
      });
      return;
    }

    const fields = userFields(session);

    const user = await prisma.user.upsert({
      where: { auth0Sub: session.user.sub },
      update: { ...fields, lastLoginAt: new Date() },
      create: {
        auth0Sub: session.user.sub,
        ...fields,
        lastLoginAt: new Date(),
      },
    });

    await prisma.session.create({
      data: {
        id,
        userId: user.id,
        auth0Sub: session.user.sub,
        sid: session.internal.sid,
        data,
        expiresAt,
      },
    });
  },

  /**
   * The rolling-session hot path: extend an existing row, but never resurrect
   * one that logout already deleted. A single UPDATE ... WHERE id keeps this
   * atomic — a get() then set() would reintroduce the race it exists to close.
   */
  async update(id, session) {
    const result = await prisma.session.updateMany({
      where: { id },
      data: {
        data: encryptSession(session),
        expiresAt: expiryFor(session),
        sid: session.internal.sid,
      },
    });

    return result.count > 0;
  },

  async delete(id) {
    await prisma.session.deleteMany({ where: { id } });
  },

  /** Back-channel logout: Auth0 tells us a session or a whole user is done. */
  async deleteByLogoutToken({ sid, sub }: LogoutToken) {
    if (!sid && !sub) {
      return;
    }

    await prisma.session.deleteMany({
      where: sid ? { sid } : { auth0Sub: sub },
    });
  },
};

/** Sweep rows whose expiry has passed. Safe to call from a cron or a job. */
export async function deleteExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return count;
}
