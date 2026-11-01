import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const settingsRouter = Router()

const defaults = {
  theme: 'dark',
  language: 'fr',
  emailNotifications: true,
  inAppNotifications: true,
  profileVisibility: 'public',
  showActivity: true,
}

const preferencesSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  language: z.enum(['fr', 'en', 'es', 'pt']).optional(),
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  profileVisibility: z.enum(['public', 'private']).optional(),
  showActivity: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Aucun réglage fourni.')

settingsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const record = await prisma.userSettings.findUnique({ where: { userId: req.userId } })
    res.json({ ...defaults, ...(record?.preferences || {}) })
  } catch (error) { next(error) }
})

settingsRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const parsed = preferencesSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Réglages invalides.' })
    const current = await prisma.userSettings.findUnique({ where: { userId: req.userId } })
    const preferences = { ...defaults, ...(current?.preferences || {}), ...parsed.data }
    const record = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, preferences },
      update: { preferences },
    })
    res.json({ ...defaults, ...(record.preferences || {}) })
  } catch (error) { next(error) }
})
