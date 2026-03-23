import { apiInstance } from "./instance"

describe("apiInstance", () => {
  it("uses VITE_API_BASE_URL or falls back to /api", () => {
    expect(apiInstance.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? "/api")
  })

  it("has a 10-second timeout", () => {
    expect(apiInstance.defaults.timeout).toBe(10_000)
  })

  it("has a Content-Type: application/json header by default", () => {
    expect(apiInstance.defaults.headers["Content-Type"]).toBe("application/json")
  })

  describe("request interceptor", () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it("injects a Bearer token when auth_token exists in localStorage", () => {
      localStorage.setItem("auth_token", "test-token-123")
      const handler = (apiInstance.interceptors.request as any).handlers[0].fulfilled
      const config = { headers: {} as Record<string, string> }
      const result = handler(config)
      expect(result.headers.Authorization).toBe("Bearer test-token-123")
    })
  })

  describe("response interceptor", () => {
    it("passes through successful responses as-is", () => {
      const handler = (apiInstance.interceptors.response as any).handlers[0].fulfilled
      const mockResponse = { status: 200, data: { ok: true } }
      expect(handler(mockResponse)).toBe(mockResponse)
    })
  })
})
