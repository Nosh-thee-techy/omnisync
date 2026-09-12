import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET and
// APP_BASE_URL from the environment. The SDK mounts its routes under /auth/*
// via the proxy — there are no route handlers to write.
export const auth0 = new Auth0Client({
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    scope: "openid profile email",
  },
});
