import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'

export const authRouter = Router()

const credentialsSchema = z.object({
  emailOrUsername: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
})
const registerSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Le pseudo ne doit contenir que des lettres, chiffres et _.'),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(128),
})

const publicUserSelect = {
  id: true, username: true, name: true, avatarUrl: true, bio: true, role: true,
  status: true, statusReason: true, suspendedUntil: true, followersCount: true,
  followingCount: true, createdAt: true,
}

function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error)
      req.session.userId = userId
      req.session.save((saveError) => saveError ? reject(saveError) : resolve())
    })
  })
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Données invalides.' })
    const { email, password } = parsed.data
    const username = parsed.data.username.toLowerCase()
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    })
    if (existing) return res.status(409).json({ message: 'Ce pseudo ou cette adresse e-mail est déjà utilisé.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, name: username, email, passwordHash },
      select: publicUserSelect,
    })
    await startSession(req, user.id)
    res.status(201).json({ user })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ce pseudo ou cette adresse e-mail est déjà utilisé.' })
    next(error)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Identifiants invalides.' })
    const { emailOrUsername, password } = parsed.data
    const identifier = emailOrUsername.toLowerCase()
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    })
    const valid = userRecord?.passwordHash ? await bcrypt.compare(password, userRecord.passwordHash) : false
    if (!userRecord || !valid) return res.status(401).json({ message: 'Identifiants incorrects.' })
    if (userRecord.status === 'banned') return res.status(403).json({ message: `Ce compte a été banni. Motif : ${userRecord.statusReason || 'non précisé'}.` })
    await startSession(req, userRecord.id)
    const user = await prisma.user.findUnique({ where: { id: userRecord.id }, select: publicUserSelect })
    res.json({ user })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Non connecté.' })
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: publicUserSelect,
    })
    if (!user || user.status === 'banned') return res.status(401).json({ message: 'Session invalide.' })
    res.json(user)
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', (req, res, next) => {
  if (!req.session) return res.status(204).end()
  req.session.destroy((error) => {
    if (error) return next(error)
    res.clearCookie('devhub.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    })
    res.status(204).end()
  })
})
