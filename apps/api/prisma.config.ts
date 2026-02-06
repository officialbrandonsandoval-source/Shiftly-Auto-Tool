import "dotenv/config"
import { defineConfig } from "prisma/config"
import * as fs from "fs"
import * as path from "path"

// Load .env.local first
const envLocalPath = path.resolve(__dirname, ".env.local")
if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, "utf-8")
  envLocal.split("\n").forEach((line) => {
    if (line && !line.startsWith("#")) {
      const [key, value] = line.split("=")
      if (key && value && !process.env[key.trim()]) {
        process.env[key.trim()] = value.replace(/"/g, "")
      }
    }
  })
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://localhost/shiftly_v3",
  },
})
