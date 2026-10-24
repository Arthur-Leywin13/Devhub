import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const projectsRouter = Router()

const projectSelect = {
  id: true, slug: true, name: true, description: true, longDescription: true,
  image: true, images: true, video: true, files: true, authorId: true, tech: true,
  category: true, github: true, demo: true, licence: true, allowDownload: true,
  likesCount: true, commentsCount: true, stars: true, createdAt: true,
}

const projectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  longDescription: z.string().max(5000).optional().default(''),
  image: z.string().max(2048).optional().default(''),
  images: z.array(z.string().max(2048)).max(6).optional().default([]),
  video: z.string().max(2048).nullable().optional(),
  files: z.array(z.object({ name: z.string().max(255), size: z.number().nonnegative(), url: z.string().max(2048) })).max(5).optional().default([]),
  tech: z.array(z.string().max(80)).max(20).optional().default([]),
  category: z.string().trim().min(1).max(80).optional().default('Autre'),
  github: z.string().url().nullable().optional(),
  demo: z.string().url().nullable().optional(),
  licence: z.enum(['Aucune', 'MIT', 'Apache 2.0', 'GPL v3', 'Propriétaire']).optional().default('Aucune'),
  allowDownload: z.boolean().optional().default(false),
})

function makeSlug(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'projet'
}

function validateWebUrl(value) {
  if (value == null) return
  let url
  try { url = new URL(value) } catch {
    throw Object.assign(new Error('URL invalide.'), { status: 400 })
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw Object.assign(new Error('Seules les URLs HTTP et HTTPS sont acceptées.'), { status: 400 })
  }
}

projectsRouter.get('/', async (req, res, next) => {
  try {
    const { authorId, category, q, sort = 'recent' } = req.query
    const where = {
      ...(authorId ? { authorId: String(authorId) } : {}),
      ...(category ? { category: String(category) } : {}),
      ...(q ? { OR: [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } },
      ] } : {}),
    }
    const projects = await prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: sort === 'popular' ? { likesCount: 'desc' } : { createdAt: 'desc' },
      take: Math.min(Math.max(Number(req.query.limit) || 20, 1), 50),
      ...(req.query.cursor ? { skip: 1, cursor: { id: String(req.query.cursor) } } : {}),
    })
    res.json(projects)
  } catch (error) {
    next(error)
  }
})

projectsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const project = await prisma.project.findFirst({
      where: id.match(/^[0-9a-f-]{36}$/i)
        ? { OR: [{ id }, { slug: id }] }
        : { slug: id },
      select: projectSelect,
    })
    if (!project) return res.status(404).json({ message: 'Projet introuvable.' })
    res.json(project)
  } catch (error) {
    next(error)
  }
})

projectsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = projectSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Projet invalide.' })
    const data = parsed.data
    validateWebUrl(data.github)
    validateWebUrl(data.demo)
    const baseSlug = makeSlug(data.name)
    let slug = baseSlug
    for (let suffix = 2; await prisma.project.findUnique({ where: { slug }, select: { id: true } }); suffix++) {
      slug = `${baseSlug}-${suffix}`
    }
    const project = await prisma.project.create({
      data: { ...data, image: data.images[0] || data.image, authorId: req.userId, slug },
      select: projectSelect,
    })
    res.status(201).json(project)
  } catch (error) {
    next(error)
  }
})

projectsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Projet introuvable.' })
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
    if (existing.authorId !== req.userId && user?.role !== 'admin') {
      return res.status(403).json({ message: 'Tu ne peux modifier que tes propres projets.' })
    }
    const parsed = projectSchema.partial().safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Modification invalide.' })
    const data = parsed.data
    validateWebUrl(data.github)
    validateWebUrl(data.demo)
    const project = await prisma.project.update({
      where: { id: existing.id },
      data: { ...data, ...(data.images ? { image: data.images[0] || data.image || '' } : {}) },
      select: projectSelect,
    })
    res.json(project)
  } catch (error) {
    next(error)
  }
})

projectsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ message: 'Projet introuvable.' })
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
    if (existing.authorId !== req.userId && user?.role !== 'admin') {
      return res.status(403).json({ message: 'Tu ne peux supprimer que tes propres projets.' })
    }
    await prisma.project.delete({ where: { id: existing.id } })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})
