import { prisma } from '../db/prisma.js'

export async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Connexion requise.' })
    }
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, status: true, suspendedUntil: true },
    })
    if (!user) return res.status(401).json({ message: 'Session invalide. Reconnecte-toi.' })
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Ce compte a été banni.' })
    }
    if (user.status === 'suspended' && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
      return res.status(403).json({ message: 'Ce compte est temporairement en lecture seule.' })
    }
    if (user.status === 'suspended' && user.suspendedUntil && user.suspendedUntil <= new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { status: 'active', statusReason: null, suspendedUntil: null } })
    }
    req.userId = user.id
    next()
  } catch (error) {
    next(error)
  }
}
