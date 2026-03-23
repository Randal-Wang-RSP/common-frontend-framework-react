import { render } from "@testing-library/react"
import { App } from "./index"

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />)
    expect(document.getElementById("app")).toBeInTheDocument()
  })
})
