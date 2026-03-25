import type { ReactElement } from "react"
import { BrowserRouter, Route, Routes } from "react-router"

import { WelcomePage } from "@/pages/welcome"

export function AppRouter(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
