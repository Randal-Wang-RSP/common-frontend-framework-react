import { env } from "./env"

describe("env", () => {
  it("exposes apiBaseUrl with /api fallback", () => {
    expect(env.apiBaseUrl).toBe(import.meta.env.VITE_API_BASE_URL ?? "/api")
  })

  it("exposes isDev as boolean", () => {
    expect(typeof env.isDev).toBe("boolean")
  })

  it("exposes mode as string", () => {
    expect(typeof env.mode).toBe("string")
  })

  it("exposes isProd as boolean", () => {
    expect(typeof env.isProd).toBe("boolean")
  })
})
