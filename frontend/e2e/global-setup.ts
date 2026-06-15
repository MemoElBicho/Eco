import { rmSync, existsSync } from "fs"
import { resolve } from "path"

export default async function globalSetup(): Promise<void> {
  const authDir = resolve(__dirname, ".auth")
  if (existsSync(authDir)) {
    rmSync(authDir, { recursive: true, force: true })
  }
}
