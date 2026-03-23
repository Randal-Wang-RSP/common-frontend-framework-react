import { apiInstance } from "./instance"

describe("apiInstance", () => {
  it("uses VITE_API_BASE_URL or falls back to /api", () => {
    expect(apiInstance.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? "/api")
  })

  it("has a 10-second timeout", () => {
    expect(apiInstance.defaults.timeout).toBe(10_000)
  })
})
