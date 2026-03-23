/**
 * Typed environment variable accessors.
 * All client-exposed variables must be prefixed VITE_.
 * Add new variables here and document them in .env.example.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const
