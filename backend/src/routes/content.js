import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const contentRouter = Router()

const authorSelect = { id: true, username: true, name: true, avatarUrl: true, role: true }
const articleInput = z.object({
  title: z.string().trim().min(5).max(180),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20).max(50000),
  category: z.string().trim().min(1).max(80),
  image: z.string().url().max(2048).nullable().optional(),
  readTime: z.number().int().min(1).max(180).optional(),
})
const postInput = z.object({
  content: z.string().trim().max(5000).optional().default(''),
  image: z.string().url().max(2048).nullable().optional(),
  video: z.string().url().max(2048).nullable().optional(),
  link: z.object({ url: z.string().url().max(2048) }).nullable().optional(),
  linkedProjectId: z.string().uuid().nullable().optional(),
  linkedArticleId: z.string().uuid().nullable().optional(),
}).refine((v) => !(v.image && v.video), 'Une publication ne peut contenir qu’une image ou une vidéo.')
  .refine((v) => v.content.length > 0 || v.image || v.video || v.link || v.linkedProjectId || v.linkedArticleId, 'La publication est vide.')

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 145) || 'article'
}

function safeUrl(value) {
  if (!value) return
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('URL non autorisée.'), { status: 400 })
}

async function resolveTarget(resource, id) {
  if (resource === 'projects') return prisma.project.findUnique({ where: { id }, select: { id: true } }).then((x) => x && { type: 'project', model: 'project' })
  if (resource === 'articles') return prisma.article.findUnique({ where: { id }, select: { id: true } }).then((x) => x && { type: 'article', model: 'article' })
  if (resource === 'posts') return prisma.post.findUnique({ where: { id }, select: { id: true } }).then((x) => x && { type: 'post', model: 'post' })
  return null
}

async function changeCounter(tx, type, id, field, delta) {
  const model = type === 'project' ? tx.project : type === 'article' ? tx.article : tx.post
  await model.update({ where: { id }, data: { [field]: { increment: delta } } })
}

async function toggleLike(type, id, userId, enabled) {
  const model = type === 'project' ? prisma.projectLike : type === 'article' ? prisma.articleLike : prisma.postLike
  const key = type === 'project' ? 'projectId' : type === 'article' ? 'articleId' : 'postId'
  const where = type === 'project' ? { projectId_userId: { projectId: id, userId } }
    : type === 'article' ? { articleId_userId: { articleId: id, userId } }
      : { postId_userId: { postId: id, userId } }
  return prisma.$transaction(async (tx) => {
    const txModel = type === 'project' ? tx.projectLike : type === 'article' ? tx.articleLike : tx.postLike
    const existing = await txModel.findUnique({ where })
    if (enabled && !existing) {
      await txModel.create({ data: { [key]: id, userId } })
      await changeCounter(tx, type, id, 'likesCount', 1)
    } else if (!enabled && existing) {
      await txModel.delete({ where: { id: existing.id } })
      await changeCounter(tx, type, id, 'likesCount', -1)
    }
    return { liked: enabled }
  })
}

async function toggleSave(type, id, userId, enabled) {
  const where = { userId_targetType_targetId: { userId, targetType: type, targetId: id } }
  return prisma.$transaction(async (tx) => {
    const existing = await tx.savedItem.findUnique({ where })
    if (enabled && !existing) await tx.savedItem.create({ data: { userId, targetType: type, targetId: id } })
    if (!enabled && existing) await tx.savedItem.delete({ where: { id: existing.id } })
    return { saved: enabled }
  })
}

// Articles
contentRouter.get('/articles', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''
    const where = {
      ...(req.query.authorId ? { authorId: String(req.query.authorId) } : {}),
      ...(req.query.category ? { category: String(req.query.category) } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }] } : {}),
      author: { status: 'active' },
    }
    const rows = await prisma.article.findMany({ where, include: { author: { select: authorSelect } }, orderBy: { createdAt: 'desc' }, take: 50 })
    res.json(rows)
  } catch (error) { next(error) }
})

contentRouter.get('/articles/:id', async (req, res, next) => {
  try {
    const article = await prisma.article.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }], author: { status: 'active' } },
      include: { author: { select: authorSelect } },
    })
    if (!article) return res.status(404).json({ message: 'Article introuvable.' })
    const userId = req.session?.userId
    const [liked, saved] = userId ? await Promise.all([
      prisma.articleLike.findUnique({ where: { articleId_userId: { articleId: article.id, userId } }, select: { id: true } }),
      prisma.savedItem.findUnique({ where: { userId_targetType_targetId: { userId, targetType: 'article', targetId: article.id } }, select: { id: true } }),
    ]) : [null, null]
    res.json({ ...article, likedByCurrentUser: Boolean(liked), savedByCurrentUser: Boolean(saved) })
  } catch (error) { next(error) }
})

contentRouter.post('/articles', requireAuth, async (req, res, next) => {
  try {
    const parsed = articleInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Article invalide.' })
    safeUrl(parsed.data.image)
    const base = slugify(parsed.data.title)
    const slug = `${base}-${Date.now().toString(36)}`
    const article = await prisma.article.create({ data: { ...parsed.data, slug, authorId: req.userId }, include: { author: { select: authorSelect } } })
    res.status(201).json(article)
  } catch (error) { next(error) }
})

for (const [resource, type] of [['articles', 'article'], ['posts', 'post']]) {
  contentRouter.post(`/${resource}/:id/like`, requireAuth, async (req, res, next) => {
    try {
      const row = await resolveTarget(resource, req.params.id)
      if (!row) return res.status(404).json({ message: 'Contenu introuvable.' })
      res.json(await toggleLike(type, req.params.id, req.userId, true))
    } catch (error) { next(error) }
  })
  contentRouter.delete(`/${resource}/:id/like`, requireAuth, async (req, res, next) => {
    try {
      const row = await resolveTarget(resource, req.params.id)
      if (!row) return res.status(404).json({ message: 'Contenu introuvable.' })
      res.json(await toggleLike(type, req.params.id, req.userId, false))
    } catch (error) { next(error) }
  })
  contentRouter.post(`/${resource}/:id/save`, requireAuth, async (req, res, next) => {
    try {
      const row = await resolveTarget(resource, req.params.id)
      if (!row) return res.status(404).json({ message: 'Contenu introuvable.' })
      res.json(await toggleSave(type, req.params.id, req.userId, true))
    } catch (error) { next(error) }
  })
  contentRouter.delete(`/${resource}/:id/save`, requireAuth, async (req, res, next) => {
    try {
      const row = await resolveTarget(resource, req.params.id)
      if (!row) return res.status(404).json({ message: 'Contenu introuvable.' })
      res.json(await toggleSave(type, req.params.id, req.userId, false))
    } catch (error) { next(error) }
  })
}

// Publications et fil d’actualité
contentRouter.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findFirst({ where: { id: req.params.id, author: { status: 'active' } }, include: { author: { select: authorSelect } } })
    if (!post) return res.status(404).json({ message: 'Publication introuvable.' })
    res.json(post)
  } catch (error) { next(error) }
})

contentRouter.get('/feed', async (req, res, next) => {
  try {
    const userId = req.session?.userId
    const following = userId ? await prisma.userFollow.findMany({ where: { followerId: userId }, select: { followingId: true } }) : []
    const authorIds = userId ? [userId, ...following.map((x) => x.followingId)] : []
    const where = { author: { status: 'active' }, ...(userId ? { authorId: { in: authorIds } } : {}) }
    const posts = await prisma.post.findMany({ where, include: { author: { select: authorSelect } }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(Number(req.query.limit) || 30, 1), 50) })
    res.json(posts)
  } catch (error) { next(error) }
})

contentRouter.post('/posts', requireAuth, async (req, res, next) => {
  try {
    const parsed = postInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Publication invalide.' })
    const data = parsed.data
    safeUrl(data.image); safeUrl(data.video); safeUrl(data.link?.url)
    if (data.linkedProjectId && !await prisma.project.findUnique({ where: { id: data.linkedProjectId }, select: { id: true } })) return res.status(404).json({ message: 'Projet lié introuvable.' })
    if (data.linkedArticleId && !await prisma.article.findUnique({ where: { id: data.linkedArticleId }, select: { id: true } })) return res.status(404).json({ message: 'Article lié introuvable.' })
    const post = await prisma.post.create({ data: { ...data, authorId: req.userId }, include: { author: { select: authorSelect } } })
    res.status(201).json(post)
  } catch (error) { next(error) }
})

// Commentaires sur projets, articles et publications
contentRouter.get('/:resource/:targetId/comments', async (req, res, next) => {
  try {
    const target = await resolveTarget(req.params.resource, req.params.targetId)
    if (!target) return res.status(404).json({ message: 'Contenu introuvable.' })
    const comments = await prisma.comment.findMany({ where: { targetType: target.type, targetId: req.params.targetId, author: { status: 'active' } }, include: { author: { select: authorSelect } }, orderBy: { createdAt: 'asc' }, take: 100 })
    res.json(comments)
  } catch (error) { next(error) }
})

contentRouter.post('/:resource/:targetId/comments', requireAuth, async (req, res, next) => {
  try {
    const target = await resolveTarget(req.params.resource, req.params.targetId)
    if (!target) return res.status(404).json({ message: 'Contenu introuvable.' })
    const parsed = z.object({ text: z.string().trim().min(1).max(2000) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Commentaire invalide.' })
    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({ data: { targetType: target.type, targetId: req.params.targetId, authorId: req.userId, text: parsed.data.text }, include: { author: { select: authorSelect } } })
      await changeCounter(tx, target.type, req.params.targetId, 'commentsCount', 1)
      return created
    })
    res.status(201).json(comment)
  } catch (error) { next(error) }
})

contentRouter.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) return res.status(404).json({ message: 'Commentaire introuvable.' })
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
    if (comment.authorId !== req.userId && !['moderator', 'admin'].includes(actor?.role)) return res.status(403).json({ message: 'Suppression non autorisée.' })
    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id: comment.id } })
      await changeCounter(tx, comment.targetType, comment.targetId, 'commentsCount', -1)
    })
    res.status(204).end()
  } catch (error) { next(error) }
})

// Favoris unifiés (projets, articles, publications)
contentRouter.get('/saved', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.savedItem.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 100 })
    const result = await Promise.all(rows.map(async (item) => {
      const target = item.targetType === 'project' ? await prisma.project.findUnique({ where: { id: item.targetId }, select: { id: true, slug: true, name: true, description: true, image: true } })
        : item.targetType === 'article' ? await prisma.article.findUnique({ where: { id: item.targetId }, select: { id: true, slug: true, title: true, excerpt: true, image: true } })
          : await prisma.post.findUnique({ where: { id: item.targetId }, select: { id: true, content: true, image: true, video: true } })
      return target ? { ...item, target } : null
    }))
    res.json(result.filter(Boolean))
  } catch (error) { next(error) }
})

contentRouter.delete('/saved/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await prisma.savedItem.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!deleted.count) return res.status(404).json({ message: 'Favori introuvable.' })
    res.status(204).end()
  } catch (error) { next(error) }
})

// Notifications personnelles
contentRouter.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.notification.findMany({
      where: { userId: req.userId },
      include: { actor: { select: authorSelect } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(rows.map(({ userId, ...row }) => row))
  } catch (error) { next(error) }
})

contentRouter.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const updated = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.userId }, data: { read: true } })
    if (!updated.count) return res.status(404).json({ message: 'Notification introuvable.' })
    res.json({ read: true })
  } catch (error) { next(error) }
})

contentRouter.post('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } })
    res.json({ read: true })
  } catch (error) { next(error) }
})
