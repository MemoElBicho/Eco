import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

export const TEST_USER = {
  name: 'E2E User',
  email: `eco-e2e-${Date.now()}@example.com`,
  password: 'e2epass123',
};

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL no esta definida. Requerida para pruebas E2E."
  )
}
export const API_URL = process.env.NEXT_PUBLIC_API_URL
