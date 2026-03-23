import { render } from "@testing-library/react"
import { App } from "./index"

describe("App", () => {
  it("renders without crashing", () => {
    expect(() => render(<App />)).not.toThrow()
  })
})
