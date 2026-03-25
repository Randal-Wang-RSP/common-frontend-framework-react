import type { ReactElement } from "react"

import styles from "./WelcomePage.module.css"

export function WelcomePage(): ReactElement {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome</h1>
    </div>
  )
}
