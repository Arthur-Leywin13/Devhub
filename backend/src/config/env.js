import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SESSION_DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET doit contenir au moins 32 caractères.'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Configuration backend invalide :', parsed.error.flatten().fieldErrors)
  throw new Error('Variables d’environnement manquantes ou invalides. Consulte .env.example.')
}

export const env = parsed.data
