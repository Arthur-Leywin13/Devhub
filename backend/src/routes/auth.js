import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { getFirebaseAdminAuth } from '../services/firebaseAdmin.js'

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
const firebaseTokenSchema = z.object({
  idToken: z.string().min(100).max(10000),
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

async function createAvailableUsername(displayName, email) {
  const source = (displayName || email.split('@')[0])
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
  const base = (source.length >= 3 ? source : `user_${source || 'new'}`).slice(0, 24)

  for (let suffix = 0; suffix < 10000; suffix += 1) {
    const username = suffix === 0 ? base : `${base.slice(0, 25)}_${suffix}`
    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!existing) return username
  }

  throw new Error('Impossible de générer un nom d’utilisateur disponible.')
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

// Google identity is verified server-side. The browser never chooses a DevHub user ID.
authRouter.post('/firebase', async (req, res, next) => {
  try {
    const parsed = firebaseTokenSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Jeton Firebase manquant ou invalide.' })

    let decoded
    try {
      decoded = await getFirebaseAdminAuth().verifyIdToken(parsed.data.idToken, true)
    } catch (error) {
      if (error.status) throw error
      return res.status(401).json({ message: 'La session Google a expiré ou n’est pas valide. Reconnectez-vous.' })
    }

    if (decoded.firebase?.sign_in_provider !== 'google.com' || decoded.email_verified !== true || !decoded.email) {
      return res.status(403).json({ message: 'Une adresse Google vérifiée est nécessaire pour continuer.' })
    }

    const email = decoded.email.trim().toLowerCase()
    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })

    if (!user) {
      const matchingEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })

      if (matchingEmail?.firebaseUid && matchingEmail.firebaseUid !== decoded.uid) {
        return res.status(409).json({ message: 'Cette adresse e-mail est déjà associée à un autre compte.' })
      }

      if (matchingEmail) {
        user = await prisma.user.update({
          where: { id: matchingEmail.id },
          data: {
            firebaseUid: decoded.uid,
            ...(matchingEmail.avatarUrl || !decoded.picture ? {} : { avatarUrl: decoded.picture }),
          },
        })
      } else {
        const displayName = typeof decoded.name === 'string' ? decoded.name.trim().slice(0, 80) : ''
        const username = await createAvailableUsername(displayName, email)
        user = await prisma.user.create({
          data: {
            firebaseUid: decoded.uid,
            username,
            name: displayName || username,
            email,
            ...(typeof decoded.picture === 'string' ? { avatarUrl: decoded.picture } : {}),
          },
        })
      }
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: `Ce compte a été banni. Motif : ${user.statusReason || 'non précisé'}.` })
    }

    await startSession(req, user.id)
    const publicUser = await prisma.user.findUnique({ where: { id: user.id }, select: publicUserSelect })
    res.json({ user: publicUser })
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ce compte existe déjà. Réessayez de vous connecter.' })
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
    if (!user) return res.status(401).json({ message: 'Session invalide.' })
    // BACKEND.md : /auth/me renvoie l'état banned pour afficher l'écran dédié.
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
