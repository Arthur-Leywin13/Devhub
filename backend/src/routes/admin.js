import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const adminRouter = Router()
export const moderationRouter = Router()

const roles = ['user', 'creator', 'moderator', 'admin']
const rank = { user: 0, creator: 1, moderator: 2, admin: 3 }
const reportTypes = ['user', 'project', 'article', 'post', 'comment', 'message', 'course']
const reasons = ['spam', 'harassment', 'inappropriate', 'impersonation', 'copyright', 'dangerous', 'other']
const staffSelect = { id: true, username: true, name: true, role: true, status: true, avatarUrl: true }
const publicSelect = { id: true, username: true, name: true, email: true, role: true, status: true, statusReason: true, suspendedUntil: true, avatarUrl: true, bio: true, followersCount: true, followingCount: true, createdAt: true }

function fail(status, message) { return Object.assign(new Error(message), { status }) }
function cleanReason(value, optional = false) {
  const reason = typeof value === 'string' ? value.trim() : ''
  if (optional && !reason) return null
  if (reason.length < 5 || reason.length > 500) throw fail(400, 'Le motif doit contenir entre 5 et 500 caractères.')
  return reason
}
async function actor(req, adminOnly = false) {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, role: true, status: true } })
  if (!user || !['moderator', 'admin'].includes(user.role)) throw fail(403, 'Accès réservé à la modération.')
  if (adminOnly && user.role !== 'admin') throw fail(403, 'Action réservée aux administrateurs.')
  return user
}
function targetModel(type) {
  return ({ user: prisma.user, project: prisma.project, article: prisma.article, post: prisma.post, comment: prisma.comment, course: prisma.course, message: prisma.message })[type]
}
async function targetInfo(type, id, report = null) {
  if (type === 'message') {
    if (report?.snapshot) return { id, label: 'Message privé signalé', excerpt: report.snapshot.text || '', authorId: report.snapshot.authorId || null, missing: false }
    const row = await prisma.message.findUnique({ where: { id }, select: { id: true, body: true, senderId: true, deletedAt: true } })
    return row ? { id, label: 'Message privé', excerpt: row.body, authorId: row.senderId, missing: Boolean(row.deletedAt) } : null
  }
  const model = targetModel(type)
  if (!model) return null
  const row = await model.findUnique({ where: { id } })
  if (!row) return null
  if (type === 'user') return { id, label: '@' + row.username, excerpt: row.bio, authorId: row.id, missing: false, link: '/profil/' + row.username }
  const authorId = type === 'comment' ? row.authorId : row.authorId
  const label = type === 'project' ? row.name : type === 'article' || type === 'course' ? row.title : type === 'post' ? 'Publication' : 'Commentaire'
  const excerpt = type === 'project' ? row.description : type === 'article' ? row.excerpt : type === 'course' ? row.description : type === 'post' ? row.content : row.text
  return { id, label, excerpt: excerpt || '', authorId, missing: false }
}
async function audit(tx, actorId, action, targetUserId, targetType, targetId, reason, metadata = undefined) {
  return tx.auditLog.create({ data: { actorId, action, targetUserId, targetType, targetId, reason, ...(metadata ? { metadata } : {}) } })
}
async function notify(tx, userId, actorId, type, targetLabel) {
  if (userId === actorId) return
  await tx.notification.create({ data: { userId, actorId, type, targetLabel } })
}
async function removeTarget(tx, type, id) {
  if (type === 'message') return tx.message.update({ where: { id }, data: { body: '', deletedAt: new Date() } })
  const model = ({ project: tx.project, article: tx.article, post: tx.post, comment: tx.comment, course: tx.course })[type]
  if (!model) throw fail(400, 'Ce type de contenu ne peut pas être supprimé.')
  return model.delete({ where: { id } })
}
async function brief(id) {
  return id ? prisma.user.findUnique({ where: { id }, select: staffSelect }) : null
}
async function enrichReport(report) {
  const target = await targetInfo(report.targetType, report.targetId, report)
  const [reporter, resolver, targetAuthor] = await Promise.all([
    brief(report.reporterId), brief(report.resolvedBy), target?.authorId ? brief(target.authorId) : null,
  ])
  return { ...report, reporter, resolver, target: target ? { ...target, link: target.link || null } : { label: 'Contenu supprimé', excerpt: '', authorId: null, missing: true }, targetAuthor }
}

const reportSchema = z.object({
  targetType: z.enum(reportTypes),
  targetId: z.string().uuid(),
  reason: z.enum(reasons),
  details: z.string().trim().max(500).optional(),
  context: z.object({ conversationId: z.string().uuid() }).optional(),
})

moderationRouter.post('/reports', async (req, res, next) => {
  try {
    const userId = req.session?.userId
    if (!userId) return res.status(401).json({ message: 'Connexion requise.' })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } })
    if (!user || user.status === 'banned') return res.status(403).json({ message: 'Compte non autorisé.' })
    const parsed = reportSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Signalement invalide.' })
    const data = parsed.data
    if (data.targetType === 'user' && data.targetId === userId) return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-même.' })
    const target = await targetInfo(data.targetType, data.targetId)
    if (!target || target.missing) return res.status(404).json({ message: 'Contenu introuvable.' })
    let snapshot = null
    if (data.targetType === 'message') {
      if (!data.context?.conversationId) return res.status(400).json({ message: 'Le contexte de conversation est obligatoire pour signaler un message.' })
      const participant = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId: data.context.conversationId, userId } } })
      const message = await prisma.message.findFirst({ where: { id: data.targetId, conversationId: data.context.conversationId, deletedAt: null } })
      if (!participant || !message) return res.status(404).json({ message: 'Message introuvable.' })
      snapshot = { text: message.body, authorId: message.senderId, createdAt: message.createdAt.toISOString() }
    }
    const report = await prisma.report.create({ data: {
      reporterId: userId, targetType: data.targetType, targetId: data.targetId,
      reason: data.reason, details: data.details || null, context: data.context || undefined,
      snapshot: snapshot || undefined,
    } })
    res.status(201).json({ id: report.id })
  } catch (error) { next(error) }
})

moderationRouter.get('/me/warnings', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.userWarning.findMany({
      where: { userId: req.userId, ...(req.query.unacknowledged === 'true' ? { acknowledgedAt: null } : {}) },
      include: { moderator: { select: staffSelect } }, orderBy: { createdAt: 'desc' }, take: 100,
    })
    res.json(rows)
  } catch (error) { next(error) }
})
moderationRouter.post('/me/warnings/:id/acknowledge', requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.userWarning.updateMany({ where: { id: req.params.id, userId: req.userId, acknowledgedAt: null }, data: { acknowledgedAt: new Date() } })
    if (!result.count) return res.status(404).json({ message: 'Avertissement introuvable ou déjà confirmé.' })
    res.status(204).end()
  } catch (error) { next(error) }
})

adminRouter.get('/stats', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const since = new Date(Date.now() - 7 * 86400000)
    const [total, newLast7Days, suspended, banned, openReports, warningsLast30Days, projects, articles, posts, courses] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { status: 'suspended' } }), prisma.user.count({ where: { status: 'banned' } }),
      prisma.report.count({ where: { status: 'open' } }),
      prisma.userWarning.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.project.count(), prisma.article.count(), prisma.post.count(), prisma.course.count(),
    ])
    res.json({ users: { total, newLast7Days, suspended, banned }, reports: { open: openReports }, warningsLast30Days, content: { projects, articles, posts, courses } })
  } catch (error) { next(error) }
})

adminRouter.get('/users', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : ''
    const users = await prisma.user.findMany({
      where: {
        ...(req.query.status ? { status: String(req.query.status) } : {}),
        ...(req.query.role ? { role: String(req.query.role) } : {}),
        ...(q ? { OR: [{ username: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      select: { ...publicSelect, _count: { select: { warningsReceived: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    res.json(users.map(({ _count, ...user }) => ({ ...user, warningsCount: _count.warningsReceived })))
  } catch (error) { next(error) }
})

adminRouter.get('/users/:id', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: publicSelect })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' })
    const [warnings, sanctions, projects, articles, posts, comments, courses] = await Promise.all([
      prisma.userWarning.findMany({ where: { userId: user.id }, include: { moderator: { select: staffSelect } }, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ where: { targetUserId: user.id }, include: { actor: { select: staffSelect } }, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where: { authorId: user.id } }), prisma.article.count({ where: { authorId: user.id } }),
      prisma.post.count({ where: { authorId: user.id } }), prisma.comment.count({ where: { authorId: user.id } }),
      prisma.course.count({ where: { authorId: user.id } }),
    ])
    res.json({ user: { ...user, warningsCount: warnings.length }, warnings, sanctions, contentCounts: { projects, articles, posts, comments, courses } })
  } catch (error) { next(error) }
})

adminRouter.post('/users/:id/warn', requireAuth, async (req, res, next) => {
  try {
    const staff = await actor(req)
    const reason = cleanReason(req.body.reason)
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable.' })
    if (target.id === staff.id || rank[target.role] >= rank[staff.role]) return res.status(403).json({ message: 'Action interdite sur ce compte.' })
    if (target.status === 'banned') return res.status(409).json({ message: 'Ce compte est banni.' })
    const warning = await prisma.$transaction(async (tx) => {
      const row = await tx.userWarning.create({ data: { userId: target.id, moderatorId: staff.id, reason }, include: { moderator: { select: staffSelect } } })
      await notify(tx, target.id, staff.id, 'warning', reason)
      await audit(tx, staff.id, 'warn', target.id, 'user', target.id, reason)
      return row
    })
    res.status(201).json(warning)
  } catch (error) { next(error) }
})

async function sanction(req, res, next, kind) {
  try {
    const staff = await actor(req, kind === 'ban' || kind === 'restoreBan')
    const reason = cleanReason(req.body.reason)
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable.' })
    if (target.id === staff.id || rank[target.role] >= rank[staff.role]) return res.status(403).json({ message: 'Action interdite sur ce compte.' })
    if (kind === 'suspend' && (target.status === 'banned' || !Number.isInteger(Number(req.body.durationDays)) || Number(req.body.durationDays) < 1 || Number(req.body.durationDays) > 365)) return res.status(400).json({ message: 'Durée ou état du compte invalide.' })
    if (kind === 'ban' && target.status === 'banned') return res.status(409).json({ message: 'Compte déjà banni.' })
    if (kind === 'restore' && target.status === 'active') return res.status(409).json({ message: 'Ce compte est déjà actif.' })
    if (kind === 'restore' && target.status === 'banned' && staff.role !== 'admin') return res.status(403).json({ message: 'Seul un administrateur peut lever un bannissement.' })
    const status = kind === 'restore' ? 'active' : kind === 'ban' ? 'banned' : 'suspended'
    const until = kind === 'suspend' ? new Date(Date.now() + Number(req.body.durationDays) * 86400000) : null
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: target.id }, data: { status, statusReason: kind === 'restore' ? null : reason, suspendedUntil: until }, select: publicSelect })
      const action = kind === 'restore' ? (target.status === 'banned' ? 'unban' : 'unsuspend') : kind
      await audit(tx, staff.id, action, target.id, 'user', target.id, reason, kind === 'suspend' ? { durationDays: Number(req.body.durationDays), suspendedUntil: until.toISOString() } : undefined)
      if (kind !== 'ban') await notify(tx, target.id, staff.id, kind === 'restore' ? 'restore' : 'suspension', kind === 'restore' ? null : reason)
      return user
    })
    res.json(updated)
  } catch (error) { next(error) }
}
adminRouter.post('/users/:id/suspend', requireAuth, (req, res, next) => sanction(req, res, next, 'suspend'))
adminRouter.post('/users/:id/ban', requireAuth, (req, res, next) => sanction(req, res, next, 'ban'))
adminRouter.post('/users/:id/restore', requireAuth, (req, res, next) => sanction(req, res, next, 'restore'))

adminRouter.patch('/users/:id/role', requireAuth, async (req, res, next) => {
  try {
    const staff = await actor(req, true)
    const parsed = z.object({ role: z.enum(roles) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Rôle invalide.' })
    if (staff.id === req.params.id) return res.status(403).json({ message: 'Vous ne pouvez pas modifier votre propre rôle.' })
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } })
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable.' })
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: target.id }, data: { role: parsed.data.role }, select: publicSelect })
      await audit(tx, staff.id, 'role_change', target.id, 'user', target.id, `Rôle ${target.role} → ${parsed.data.role}`, { from: target.role, to: parsed.data.role })
      return user
    })
    res.json(updated)
  } catch (error) { next(error) }
})

adminRouter.get('/reports', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const status = ['open', 'resolved', 'dismissed'].includes(String(req.query.status)) ? String(req.query.status) : undefined
    const rows = await prisma.report.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' }, take: 100 })
    res.json(await Promise.all(rows.map(enrichReport)))
  } catch (error) { next(error) }
})

adminRouter.post('/reports/:id/dismiss', requireAuth, async (req, res, next) => {
  try {
    const staff = await actor(req)
    const reason = cleanReason(req.body.reason, true)
    const report = await prisma.report.findUnique({ where: { id: req.params.id } })
    if (!report) return res.status(404).json({ message: 'Signalement introuvable.' })
    if (report.status !== 'open') return res.status(409).json({ message: 'Signalement déjà traité.' })
    const target = await targetInfo(report.targetType, report.targetId, report)
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.report.update({ where: { id: report.id }, data: { status: 'dismissed', resolution: 'none', resolvedBy: staff.id, resolvedAt: new Date(), note: reason } })
      await audit(tx, staff.id, 'report_dismissed', target?.authorId || null, 'report', report.id, reason)
      return row
    })
    res.json(await enrichReport(updated))
  } catch (error) { next(error) }
})

adminRouter.post('/reports/:id/resolve', requireAuth, async (req, res, next) => {
  try {
    const staff = await actor(req)
    const parsed = z.object({ action: z.enum(['warn', 'suspend', 'ban', 'delete_content']), reason: z.string().trim().min(5).max(500), durationDays: z.number().int().min(1).max(365).optional(), deleteContent: z.boolean().optional() }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Résolution invalide.' })
    const { action, reason, durationDays, deleteContent } = parsed.data
    if (action === 'ban' && staff.role !== 'admin') return res.status(403).json({ message: 'Action réservée aux administrateurs.' })
    if (action === 'suspend' && !durationDays) return res.status(400).json({ message: 'Durée de suspension obligatoire.' })
    const report = await prisma.report.findUnique({ where: { id: req.params.id } })
    if (!report) return res.status(404).json({ message: 'Signalement introuvable.' })
    if (report.status !== 'open') return res.status(409).json({ message: 'Signalement déjà traité.' })
    const target = await targetInfo(report.targetType, report.targetId, report)
    if (!target) return res.status(404).json({ message: 'Cible introuvable.' })
    const user = target.authorId ? await prisma.user.findUnique({ where: { id: target.authorId } }) : null
    if (['warn', 'suspend', 'ban'].includes(action)) {
      if (!user) return res.status(400).json({ message: 'Auteur introuvable.' })
      if (user.id === staff.id || rank[user.role] >= rank[staff.role]) return res.status(403).json({ message: 'Sanction interdite sur ce compte.' })
      if (action === 'ban' && user.status === 'banned') return res.status(409).json({ message: 'Compte déjà banni.' })
      if (action === 'suspend' && user.status === 'banned') return res.status(409).json({ message: 'Compte déjà banni.' })
    }
    const shouldDelete = action === 'delete_content' || (deleteContent && report.targetType !== 'user')
    if (action === 'delete_content' && report.targetType === 'user') return res.status(400).json({ message: 'Utilisez une sanction pour traiter un profil.' })
    const updated = await prisma.$transaction(async (tx) => {
      if (shouldDelete && !target.missing) await removeTarget(tx, report.targetType, report.targetId)
      if (user && action === 'warn') {
        await tx.userWarning.create({ data: { userId: user.id, moderatorId: staff.id, reason } })
        await notify(tx, user.id, staff.id, 'warning', reason)
      }
      if (user && ['suspend', 'ban'].includes(action)) {
        const status = action === 'ban' ? 'banned' : 'suspended'
        const suspendedUntil = action === 'suspend' ? new Date(Date.now() + durationDays * 86400000) : null
        await tx.user.update({ where: { id: user.id }, data: { status, statusReason: reason, suspendedUntil } })
        if (action === 'suspend') await notify(tx, user.id, staff.id, 'suspension', reason)
      }
      if (user && ['warn', 'suspend', 'ban'].includes(action)) await audit(tx, staff.id, action, user.id, 'user', user.id, reason, action === 'suspend' ? { durationDays } : undefined)
      await audit(tx, staff.id, 'report_resolved', target.authorId || null, 'report', report.id, reason, { action, deleteContent: Boolean(shouldDelete) })
      return tx.report.update({ where: { id: report.id }, data: { status: 'resolved', resolution: action, resolvedBy: staff.id, resolvedAt: new Date(), note: reason } })
    })
    res.json(await enrichReport(updated))
  } catch (error) { next(error) }
})

adminRouter.get('/content', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const type = ['project', 'article', 'post', 'course', 'comment'].includes(String(req.query.type)) ? String(req.query.type) : 'project'
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''
    const where = q ? (type === 'project' ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }
      : type === 'article' ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }] }
        : type === 'course' ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }
          : type === 'post' ? { content: { contains: q, mode: 'insensitive' } } : { text: { contains: q, mode: 'insensitive' } }) : {}
    const model = ({ project: prisma.project, article: prisma.article, post: prisma.post, course: prisma.course, comment: prisma.comment })[type]
    const rows = await model.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
    const result = await Promise.all(rows.map(async (row) => {
      const author = row.authorId ? await brief(row.authorId) : null
      return { id: row.id, type, title: type === 'project' ? row.name : type === 'article' || type === 'course' ? row.title : type === 'post' ? 'Publication' : 'Commentaire', excerpt: type === 'project' ? row.description : type === 'article' ? row.excerpt : type === 'course' ? row.description : type === 'post' ? row.content : row.text, authorId: row.authorId, author, createdAt: row.createdAt, link: null }
    }))
    res.json(result)
  } catch (error) { next(error) }
})

adminRouter.post('/content/:type/:id/remove', requireAuth, async (req, res, next) => {
  try {
    const staff = await actor(req)
    const reason = cleanReason(req.body.reason)
    const type = String(req.params.type)
    if (!['project', 'article', 'post', 'course', 'comment', 'message'].includes(type)) return res.status(400).json({ message: 'Type de contenu invalide.' })
    const target = await targetInfo(type, req.params.id)
    if (!target || target.missing) return res.status(404).json({ message: 'Contenu introuvable.' })
    await prisma.$transaction(async (tx) => {
      await removeTarget(tx, type, req.params.id)
      await audit(tx, staff.id, 'delete_content', target.authorId || null, type, req.params.id, reason)
    })
    res.status(204).end()
  } catch (error) { next(error) }
})

adminRouter.get('/audit-log', requireAuth, async (req, res, next) => {
  try {
    await actor(req)
    const rows = await prisma.auditLog.findMany({
      where: {
        ...(req.query.action ? { action: String(req.query.action) } : {}),
        ...(req.query.targetUserId ? { targetUserId: String(req.query.targetUserId) } : {}),
        ...(req.query.actorId ? { actorId: String(req.query.actorId) } : {}),
      },
      include: { actor: { select: staffSelect } }, orderBy: { createdAt: 'desc' }, take: 200,
    })
    const result = await Promise.all(rows.map(async (row) => ({ ...row, targetUser: await brief(row.targetUserId) })))
    res.json(result)
  } catch (error) { next(error) }
})
