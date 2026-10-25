import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const usersRouter = Router()

const publicUserSelect = {
  id: true, username: true, name: true, avatarUrl: true, bio: true, role: true,
  status: true, followersCount: true, followingCount: true, createdAt: true,
}

function publicProfile(user) {
  if (!user) return user
  const { statusReason, suspendedUntil, email, passwordHash, ...safe } = user
  return safe
}

usersRouter.get('/suggested', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 20)
    const exclude = typeof req.query.exclude === 'string' ? req.query.exclude : null
    const users = await prisma.user.findMany({
      where: { status: 'active', ...(exclude ? { id: { not: exclude } } : {}) },
      select: publicUserSelect,
      orderBy: [{ followersCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
    res.json(users.map(publicProfile))
  } catch (error) { next(error) }
})

usersRouter.get('/id/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: publicUserSelect,
    })
    if (!user || user.status === 'banned') return res.status(404).json({ message: 'Profil introuvable.' })
    res.json(publicProfile(user))
  } catch (error) { next(error) }
})

usersRouter.get('/:id/follow-status', requireAuth, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!target) return res.status(404).json({ message: 'Profil introuvable.' })
    const following = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
      select: { id: true },
    })
    res.json({ following: Boolean(following) })
  } catch (error) { next(error) }
})

usersRouter.get('/:username', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: {
        ...publicUserSelect,
        projects: {
          select: {
            id: true, slug: true, name: true, description: true, image: true,
            images: true, tech: true, category: true, github: true, demo: true,
            likesCount: true, commentsCount: true, stars: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })
    if (!user || user.status === 'banned') return res.status(404).json({ message: 'Profil introuvable.' })
    res.json(publicProfile(user))
  } catch (error) { next(error) }
})

usersRouter.post('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === req.userId) return res.status(400).json({ message: 'Tu ne peux pas te suivre toi-même.' })
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, status: true } })
    if (!target || target.status !== 'active') return res.status(404).json({ message: 'Profil introuvable.' })
    await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
      })
      if (existing) return
      await tx.userFollow.create({ data: { followerId: req.userId, followingId: target.id } })
      await tx.user.update({ where: { id: req.userId }, data: { followingCount: { increment: 1 } } })
      await tx.user.update({ where: { id: target.id }, data: { followersCount: { increment: 1 } } })
    })
    res.json({ following: true })
  } catch (error) { next(error) }
})

usersRouter.delete('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.userFollow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: req.params.id } },
      })
      if (!existing) return
      await tx.userFollow.delete({ where: { id: existing.id } })
      await tx.user.update({ where: { id: req.userId }, data: { followingCount: { decrement: 1 } } })
      await tx.user.update({ where: { id: req.params.id }, data: { followersCount: { decrement: 1 } } })
    })
    res.json({ following: false })
  } catch (error) { next(error) }
})
