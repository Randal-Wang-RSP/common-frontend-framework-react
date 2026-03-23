import { AppRouter } from "./router"
import { Providers } from "./providers"
import "./styles/index.css"

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
