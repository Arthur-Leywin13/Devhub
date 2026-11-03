import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import pgSession from 'connect-pg-simple'
import pg from 'pg'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { projectsRouter } from './routes/projects.js'
import { usersRouter } from './routes/users.js'
import { settingsRouter } from './routes/settings.js'
import { searchRouter } from './routes/search.js'
import { conversationsRouter } from './routes/conversations.js'
import { contentRouter } from './routes/content.js'
import { coursesRouter } from './routes/courses.js'
import { adminRouter, moderationRouter } from './routes/admin.js'

const app = express()
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
const api = express.Router()
const PgStore = pgSession(session)
const sessionPool = new pg.Pool({
  connectionString: env.SESSION_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
})

if (env.NODE_ENV === 'production') app.set('trust proxy', 1)

app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))

// Frontend Vite construit (dist/), servi avant la session pour éviter des accès base inutiles.
app.use(express.static(distDir, { index: false, maxAge: '1h' }))
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '1mb' }))

app.use(session({
  name: 'devhub.sid',
  store: new PgStore({
    pool: sessionPool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 15 * 60,
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}))

// Vérification d'origine contre les requêtes intersites qui modifient des données.
// À conserver avec les cookies SameSite et une politique CORS restrictive.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (!origin || origin !== env.FRONTEND_URL) {
    return res.status(403).json({ message: 'Origine de requête non autorisée.' })
  }
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessaie dans quelques minutes.' },
})

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Trop de recherches. Réessaie dans quelques minutes.' },
})

api.use('/auth', authLimiter)
api.use('/search', searchLimiter)

api.get('/', (_req, res) => res.json({ name: 'DevHub API', status: 'running' }))
api.use('/health', healthRouter)
api.use('/auth', authRouter)
api.use('/projects', projectsRouter)
api.use('/users', usersRouter)
api.use('/settings', settingsRouter)
api.use('/search', searchRouter)
api.use('/conversations', conversationsRouter)
api.use('/courses', coursesRouter)
api.use('/admin', adminRouter)
api.use('/', moderationRouter)
api.use('/', contentRouter)

app.use('/api', api)
app.use('/api', (_req, res) => res.status(404).json({ message: 'Route API introuvable.' }))

// Application React : toute autre requête GET renvoie index.html (routage côté client).
app.get('/{*splat}', (_req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => err && next())
})

app.use((req, res) => res.status(404).json({ message: 'Route API introuvable.' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({
    message: err.status && err.status < 500 ? err.message : 'Une erreur interne est survenue.',
  })
})

export { app, sessionPool }
