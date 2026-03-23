import { apiInstance } from "./instance"

describe("apiInstance", () => {
  it("uses /api as the default baseURL", () => {
    expect(apiInstance.defaults.baseURL).toBe("/api")
  })

  it("has a 10-second timeout", () => {
    expect(apiInstance.defaults.timeout).toBe(10_000)
  })

  it("has a Content-Type: application/json header by default", () => {
    expect(apiInstance.defaults.headers["Content-Type"]).toBe("application/json")
  })
})
