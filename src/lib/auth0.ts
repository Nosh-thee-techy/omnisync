import { Auth0Client } from "@auth0/nextjs-auth0/server";

const requiredVariables = ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_SECRET"] as const;

/** True only when this deployment has a complete Auth0 application configuration. */
export const isAuth0Configured = requiredVariables.every((name) => Boolean(process.env[name]));

// Do not instantiate the SDK until tenant configuration exists: this preserves the
// API gateway's local mock mode for UI development without weakening production auth.
export const auth0 = isAuth0Configured ? new Auth0Client() : null;
