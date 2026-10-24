import { client } from './client'
import { isMockMode } from './mode'
import { delay, mockSession } from './mockSession'
import { usersMock } from '../mocks/users.mock'
import { moderationMock } from '../mocks/moderation.mock'
import { notificationsMock } from '../mocks/notifications.mock'
import { projectsMock } from '../mocks/projects.mock'
import { articlesMock } from '../mocks/articles.mock'
import { postsMock } from '../mocks/posts.mock'
import { commentsMock } from '../mocks/comments.mock'
import { coursesMock } from '../mocks/courses.mock'
import { messagesMock } from '../mocks/messages.mock'
import { ROLE_RANK, isStaff, isAdmin } from '../lib/permissions'
import { MIN_REASON_LENGTH, MAX_REASON_LENGTH } from '../lib/moderation'

// ───────────────────────────────────────────────────────────────────────────
// API d'administration — TOUTES ces routes exigent le rôle moderator ou admin
// (403 sinon). Le backend applique les règles ; le frontend ne fait que les afficher.
//
// GET  /admin/stats
// GET  /admin/users?q=&status=&role=            -> AdminUser[]
// GET  /admin/users/:id                          -> { user, warnings, sanctions, contentCounts }
// POST /admin/users/:id/warn      { reason }                    -> Warning
// POST /admin/users/:id/suspend   { reason, durationDays }      -> AdminUser
// POST /admin/users/:id/ban       { reason }                    -> AdminUser   (admin uniquement)
// POST /admin/users/:id/restore   { reason }                    -> AdminUser   (lève suspension ; ban = admin)
// PATCH /admin/users/:id/role     { role }                      -> AdminUser   (admin uniquement)
// GET  /admin/reports?status=open|resolved|dismissed             -> Report[] (cible + auteur résolus)
// POST /admin/reports/:id/resolve { action, reason, durationDays?, deleteContent? } -> Report
// POST /admin/reports/:id/dismiss { reason? }                    -> Report
// GET  /admin/content?type=&q=                                   -> ContentItem[]
// POST /admin/content/:type/:id/remove { reason }                -> 204
// GET  /admin/audit-log?action=&targetUserId=&actorId=           -> AuditEntry[]
//
// Règles : motif obligatoire (5–500 car.) pour toute sanction · on ne sanctionne ni soi-même ni
// un rang égal/supérieur · bannir, lever un bannissement, changer un rôle = admin uniquement ·
// chaque action est écrite dans le journal d'audit.
// ───────────────────────────────────────────────────────────────────────────

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function currentStaff() {
  const id = mockSession.getUserId()
  const user = id ? usersMock.getById(id) : null
  if (!user) throw fail(401, 'Non authentifié.')
  if (!isStaff(user)) throw fail(403, 'Accès réservé à la modération.')
  return user
}

function cleanReason(reason) {
  const r = (reason || '').trim()
  if (r.length < MIN_REASON_LENGTH) throw fail(400, `Un motif d'au moins ${MIN_REASON_LENGTH} caractères est obligatoire.`)
  if (r.length > MAX_REASON_LENGTH) throw fail(400, `Motif trop long (${MAX_REASON_LENGTH} caractères maximum).`)
  return r
}

function userOrFail(id) {
  const user = usersMock.getById(id)
  if (!user) throw fail(404, 'Utilisateur introuvable.')
  return user
}

function assertSanction(actor, user) {
  if (actor.id === user.id) throw fail(403, 'Vous ne pouvez pas vous sanctionner vous-même.')
  if (ROLE_RANK[user.role] >= ROLE_RANK[actor.role]) {
    throw fail(403, 'Vous ne pouvez pas sanctionner un compte de rang égal ou supérieur au vôtre.')
  }
}

const brief = (id) => {
  const u = id ? usersMock.getById(id) : null
  return u ? { id: u.id, username: u.username, name: u.name, role: u.role, status: u.status, avatarUrl: u.avatarUrl } : null
}

// L'email est une donnée privée : visible uniquement dans l'espace d'administration.
const toAdminUser = (u) => ({
  ...u,
  email: `${u.username}@example.com`,
  warningsCount: moderationMock.listWarnings(u.id).length,
})

// ── Contenus ───────────────────────────────────────────────────────────────
function describeTarget(type, id, report = null) {
  const missing = { label: 'Contenu supprimé', excerpt: '', authorId: null, link: null, missing: true }
  if (type === 'user') {
    const u = usersMock.getById(id)
    return u ? { label: `@${u.username}`, excerpt: u.bio || '', authorId: u.id, link: `/profil/${u.username}` } : missing
  }
  if (type === 'project') {
    const p = projectsMock.getById(id)
    return p ? { label: p.name, excerpt: p.description, authorId: p.authorId, link: `/projets/${p.slug || p.id}` } : missing
  }
  if (type === 'article') {
    const a = articlesMock.getById(id)
    return a ? { label: a.title, excerpt: a.excerpt, authorId: a.authorId, link: `/articles/${a.slug || a.id}` } : missing
  }
  if (type === 'post') {
    const p = postsMock.getById(id)
    return p ? { label: 'Publication', excerpt: p.content || '(média ou lien)', authorId: p.authorId, link: `/publications/${p.id}` } : missing
  }
  if (type === 'course') {
    const c = coursesMock.getById(id)
    return c ? { label: c.title, excerpt: c.description, authorId: c.authorId, link: `/cours/${c.slug || c.id}` } : missing
  }
  if (type === 'comment') {
    const c = commentsMock.getById(id)
    if (!c) return missing
    const parent = describeTarget(c.targetType, c.targetId)
    return { label: `Commentaire sur « ${parent.label} »`, excerpt: c.text, authorId: c.authorId, link: parent.link }
  }
  if (type === 'message') {
    const snap = report?.snapshot
    if (!snap) return missing
    return {
      label: 'Message privé signalé',
      excerpt: snap.text || `(${(snap.attachmentTypes || []).join(', ') || 'pièce jointe'})`,
      authorId: snap.authorId,
      link: null,
    }
  }
  return missing
}

function removeContent(type, id) {
  if (type === 'project') projectsMock.remove(id)
  else if (type === 'article') articlesMock.remove(id)
  else if (type === 'post') postsMock.remove(id)
  else if (type === 'course') coursesMock.remove(id)
  else if (type === 'message') messagesMock.forceDeleteMessage(id)
  else if (type === 'comment') {
    const c = commentsMock.getById(id)
    if (c) {
      commentsMock.remove(id)
      const parentMock = { project: projectsMock, article: articlesMock, post: postsMock }[c.targetType]
      const parent = parentMock?.getById(c.targetId)
      if (parent) parentMock.update(c.targetId, { commentsCount: Math.max(0, (parent.commentsCount || 0) - 1) })
    }
  } else throw fail(400, 'Ce type de contenu ne peut pas être supprimé.')
}

function performContentRemoval(actor, type, id, reason) {
  const target = describeTarget(type, id)
  if (target.missing) throw fail(404, 'Ce contenu n\'existe plus.')
  removeContent(type, id)
  moderationMock.log({ actorId: actor.id, action: 'delete_content', targetUserId: target.authorId, targetType: type, targetId: id, reason })
}

// ── Sanctions ──────────────────────────────────────────────────────────────
function applyWarn(actor, user, reason) {
  assertSanction(actor, user)
  if (user.status === 'banned') throw fail(409, 'Ce compte est déjà banni.')
  const warning = moderationMock.addWarning(user.id, actor.id, reason)
  moderationMock.log({ actorId: actor.id, action: 'warn', targetUserId: user.id, targetType: 'user', targetId: user.id, reason })
  notificationsMock.add({ userId: user.id, type: 'warning', targetLabel: reason })
  return warning
}

function applySuspend(actor, user, reason, durationDays) {
  assertSanction(actor, user)
  if (user.status === 'banned') throw fail(409, 'Ce compte est déjà banni.')
  const days = Number(durationDays)
  if (!Number.isInteger(days) || days < 1 || days > 365) throw fail(400, 'Durée de suspension invalide (1 à 365 jours).')
  const suspendedUntil = new Date(Date.now() + days * 86400000).toISOString()
  const updated = usersMock.update(user.id, { status: 'suspended', statusReason: reason, suspendedUntil })
  moderationMock.log({ actorId: actor.id, action: 'suspend', targetUserId: user.id, targetType: 'user', targetId: user.id, reason, metadata: { durationDays: days, suspendedUntil } })
  notificationsMock.add({ userId: user.id, type: 'suspension', targetLabel: reason })
  return updated
}

function applyBan(actor, user, reason) {
  if (!isAdmin(actor)) throw fail(403, 'Seuls les administrateurs peuvent bannir un compte.')
  assertSanction(actor, user)
  if (user.status === 'banned') throw fail(409, 'Ce compte est déjà banni.')
  const updated = usersMock.update(user.id, { status: 'banned', statusReason: reason, suspendedUntil: null })
  moderationMock.log({ actorId: actor.id, action: 'ban', targetUserId: user.id, targetType: 'user', targetId: user.id, reason })
  return updated
}

function applyRestore(actor, user, reason) {
  assertSanction(actor, user)
  if (user.status === 'active') throw fail(409, "Ce compte n'est pas sanctionné.")
  if (user.status === 'banned' && !isAdmin(actor)) throw fail(403, 'Seuls les administrateurs peuvent lever un bannissement.')
  const wasBanned = user.status === 'banned'
  const updated = usersMock.update(user.id, { status: 'active', statusReason: null, suspendedUntil: null })
  moderationMock.log({ actorId: actor.id, action: wasBanned ? 'unban' : 'unsuspend', targetUserId: user.id, targetType: 'user', targetId: user.id, reason })
  if (!wasBanned) notificationsMock.add({ userId: user.id, type: 'restore', targetLabel: null })
  return updated
}

const byDateDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

function enrichReport(r) {
  const target = describeTarget(r.targetType, r.targetId, r)
  return { ...r, reporter: brief(r.reporterId), target, targetAuthor: brief(target.authorId), resolver: brief(r.resolvedBy) }
}

export const adminApi = {
  async getStats() {
    if (isMockMode) {
      await delay()
      currentStaff()
      const users = usersMock.list()
      const week = 7 * 86400000
      return {
        users: {
          total: users.length,
          newLast7Days: users.filter((u) => Date.now() - new Date(u.createdAt).getTime() <= week).length,
          suspended: users.filter((u) => u.status === 'suspended').length,
          banned: users.filter((u) => u.status === 'banned').length,
        },
        reports: { open: moderationMock.listReports('open').length },
        warningsLast30Days: moderationMock.countWarningsSince(30 * 86400000),
        content: {
          projects: projectsMock.list({}).length,
          articles: articlesMock.list({}).length,
          posts: postsMock.list({}).length,
          courses: coursesMock.list({}).length,
        },
      }
    }
    return client.get('/admin/stats')
  },

  async listUsers({ q, status, role } = {}) {
    if (isMockMode) {
      await delay()
      currentStaff()
      const needle = (q || '').trim().toLowerCase()
      return usersMock
        .list()
        .filter((u) => !needle || u.username.toLowerCase().includes(needle) || u.name.toLowerCase().includes(needle))
        .filter((u) => !status || u.status === status)
        .filter((u) => !role || u.role === role)
        .map(toAdminUser)
    }
    return client.get('/admin/users', { q, status, role })
  },

  async getUser(id) {
    if (isMockMode) {
      await delay()
      currentStaff()
      const user = userOrFail(id)
      return {
        user: toAdminUser(user),
        warnings: moderationMock.listWarnings(id).map((w) => ({ ...w, moderator: brief(w.moderatorId) })),
        sanctions: moderationMock.listAudit({ targetUserId: id }).map((a) => ({ ...a, actor: brief(a.actorId) })),
        contentCounts: {
          projects: projectsMock.list({ authorId: id }).length,
          articles: articlesMock.list({ authorId: id }).length,
          posts: postsMock.list({ authorId: id }).length,
          comments: commentsMock.listAll().filter((c) => c.authorId === id).length,
          courses: coursesMock.list({ authorId: id }).length,
        },
      }
    }
    return client.get(`/admin/users/${id}`)
  },

  async warnUser(id, { reason }) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      return applyWarn(actor, userOrFail(id), cleanReason(reason))
    }
    return client.post(`/admin/users/${id}/warn`, { reason })
  },

  async suspendUser(id, { reason, durationDays }) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      return toAdminUser(applySuspend(actor, userOrFail(id), cleanReason(reason), durationDays))
    }
    return client.post(`/admin/users/${id}/suspend`, { reason, durationDays })
  },

  async banUser(id, { reason }) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      return toAdminUser(applyBan(actor, userOrFail(id), cleanReason(reason)))
    }
    return client.post(`/admin/users/${id}/ban`, { reason })
  },

  async restoreUser(id, { reason }) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      return toAdminUser(applyRestore(actor, userOrFail(id), cleanReason(reason)))
    }
    return client.post(`/admin/users/${id}/restore`, { reason })
  },

  async setRole(id, role) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      if (!isAdmin(actor)) throw fail(403, 'Seuls les administrateurs peuvent changer un rôle.')
      if (actor.id === id) throw fail(403, 'Vous ne pouvez pas modifier votre propre rôle.')
      if (!(role in ROLE_RANK)) throw fail(400, 'Rôle invalide.')
      const user = userOrFail(id)
      if (user.role === role) return toAdminUser(user)
      const updated = usersMock.update(id, { role })
      moderationMock.log({ actorId: actor.id, action: 'role_change', targetUserId: id, targetType: 'user', targetId: id, reason: `Rôle ${user.role} → ${role}`, metadata: { from: user.role, to: role } })
      return toAdminUser(updated)
    }
    return client.patch(`/admin/users/${id}/role`, { role })
  },

  async listReports(status) {
    if (isMockMode) {
      await delay()
      currentStaff()
      return moderationMock.listReports(status).map(enrichReport)
    }
    return client.get('/admin/reports', { status })
  },

  async resolveReport(id, { action, reason, durationDays, deleteContent }) {
    if (isMockMode) {
      await delay(350)
      const actor = currentStaff()
      const report = moderationMock.getReport(id)
      if (!report) throw fail(404, 'Signalement introuvable.')
      if (report.status !== 'open') throw fail(409, 'Ce signalement a déjà été traité.')
      const note = cleanReason(reason)
      const target = describeTarget(report.targetType, report.targetId, report)
      const author = target.authorId ? usersMock.getById(target.authorId) : null

      if (['warn', 'suspend', 'ban'].includes(action) && !author) throw fail(400, "L'auteur du contenu est introuvable.")
      if (action === 'delete_content' && report.targetType === 'user') throw fail(400, 'Un profil ne peut pas être supprimé ici : choisissez une sanction.')

      // Vérifier AVANT d'agir pour ne jamais appliquer une action à moitié.
      if (action === 'ban' && !isAdmin(actor)) throw fail(403, 'Seuls les administrateurs peuvent bannir un compte.')
      if (author && ['warn', 'suspend', 'ban'].includes(action)) assertSanction(actor, author)

      const removeToo = action === 'delete_content' || (deleteContent && report.targetType !== 'user')
      if (removeToo && !target.missing) performContentRemoval(actor, report.targetType, report.targetId, note)
      if (action === 'warn') applyWarn(actor, author, note)
      if (action === 'suspend') applySuspend(actor, author, note, durationDays)
      if (action === 'ban') applyBan(actor, author, note)

      const updated = moderationMock.updateReport(id, {
        status: 'resolved', resolution: action, resolvedBy: actor.id, resolvedAt: new Date().toISOString(), note,
      })
      moderationMock.log({ actorId: actor.id, action: 'report_resolved', targetUserId: target.authorId, targetType: 'report', targetId: id, reason: note, metadata: { action, deleteContent: !!removeToo } })
      return enrichReport(updated)
    }
    return client.post(`/admin/reports/${id}/resolve`, { action, reason, durationDays, deleteContent })
  },

  async dismissReport(id, { reason } = {}) {
    if (isMockMode) {
      await delay(250)
      const actor = currentStaff()
      const report = moderationMock.getReport(id)
      if (!report) throw fail(404, 'Signalement introuvable.')
      if (report.status !== 'open') throw fail(409, 'Ce signalement a déjà été traité.')
      const note = (reason || '').trim().slice(0, MAX_REASON_LENGTH) || null
      const updated = moderationMock.updateReport(id, {
        status: 'dismissed', resolution: 'none', resolvedBy: actor.id, resolvedAt: new Date().toISOString(), note,
      })
      const target = describeTarget(report.targetType, report.targetId, report)
      moderationMock.log({ actorId: actor.id, action: 'report_dismissed', targetUserId: target.authorId, targetType: 'report', targetId: id, reason: note })
      return enrichReport(updated)
    }
    return client.post(`/admin/reports/${id}/dismiss`, { reason })
  },

  async listContent({ type = 'project', q = '' } = {}) {
    if (isMockMode) {
      await delay()
      currentStaff()
      const needle = q.trim().toLowerCase()
      let items = []
      if (type === 'project') items = projectsMock.list({}).map((p) => ({ id: p.id, title: p.name, excerpt: p.description, authorId: p.authorId, createdAt: p.createdAt, link: `/projets/${p.slug || p.id}` }))
      if (type === 'article') items = articlesMock.list({}).map((a) => ({ id: a.id, title: a.title, excerpt: a.excerpt, authorId: a.authorId, createdAt: a.createdAt, link: `/articles/${a.slug || a.id}` }))
      if (type === 'post') items = postsMock.list({}).map((p) => ({ id: p.id, title: 'Publication', excerpt: p.content || '(média ou lien)', authorId: p.authorId, createdAt: p.createdAt, link: `/publications/${p.id}` }))
      if (type === 'course') items = coursesMock.list({}).map((c) => ({ id: c.id, title: c.title, excerpt: c.description, authorId: c.authorId, createdAt: c.createdAt || '', link: `/cours/${c.slug || c.id}` }))
      if (type === 'comment') {
        items = commentsMock.listAll().map((c) => {
          const t = describeTarget('comment', c.id)
          return { id: c.id, title: t.label, excerpt: c.text, authorId: c.authorId, createdAt: c.createdAt, link: t.link }
        })
      }
      return items
        .filter((i) => !needle || i.title.toLowerCase().includes(needle) || (i.excerpt || '').toLowerCase().includes(needle))
        .sort(byDateDesc)
        .map((i) => ({ ...i, type, author: brief(i.authorId) }))
    }
    return client.get('/admin/content', { type, q })
  },

  async deleteContent(type, id, { reason }) {
    if (isMockMode) {
      await delay(300)
      const actor = currentStaff()
      performContentRemoval(actor, type, id, cleanReason(reason))
      return null
    }
    return client.post(`/admin/content/${type}/${id}/remove`, { reason })
  },

  async listAuditLog({ action, targetUserId, actorId } = {}) {
    if (isMockMode) {
      await delay()
      currentStaff()
      return moderationMock
        .listAudit({ action, targetUserId, actorId })
        .map((a) => ({ ...a, actor: brief(a.actorId), targetUser: brief(a.targetUserId) }))
    }
    return client.get('/admin/audit-log', { action, targetUserId, actorId })
  },
}
