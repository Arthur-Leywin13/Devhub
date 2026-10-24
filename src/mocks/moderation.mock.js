// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : POST /reports, GET /admin/reports, GET /me/warnings,
// GET /admin/audit-log

let reports = [
  { id: 'r1', reporterId: 'u3', targetType: 'comment', targetId: 'cm1', reason: 'spam', details: 'Commentaire promotionnel répété.', context: null, snapshot: null, status: 'open', resolution: null, resolvedBy: null, resolvedAt: null, note: null, createdAt: '2026-09-19T10:00:00Z' },
  { id: 'r2', reporterId: 'u2', targetType: 'project', targetId: 'p3', reason: 'inappropriate', details: "Le projet semble contourner les protections d'un service.", context: null, snapshot: null, status: 'open', resolution: null, resolvedBy: null, resolvedAt: null, note: null, createdAt: '2026-09-18T15:00:00Z' },
  { id: 'r3', reporterId: 'u4', targetType: 'post', targetId: 'f2', reason: 'other', details: 'Information erronée.', context: null, snapshot: null, status: 'open', resolution: null, resolvedBy: null, resolvedAt: null, note: null, createdAt: '2026-09-17T09:00:00Z' },
  { id: 'r4', reporterId: 'u2', targetType: 'user', targetId: 'u4', reason: 'impersonation', details: null, context: null, snapshot: null, status: 'dismissed', resolution: 'none', resolvedBy: 'u1', resolvedAt: '2026-09-16T12:00:00Z', note: 'Aucune preuve.', createdAt: '2026-09-16T08:00:00Z' },
]

let warnings = [
  { id: 'w1', userId: 'u4', moderatorId: 'u1', reason: "Langage inapproprié dans un commentaire (exemple de test).", createdAt: '2026-09-20T08:00:00Z', acknowledgedAt: null },
]

let audit = [
  { id: 'a1', actorId: 'u1', action: 'warn', targetUserId: 'u4', targetType: 'user', targetId: 'u4', reason: "Langage inapproprié dans un commentaire (exemple de test).", metadata: null, createdAt: '2026-09-20T08:00:00Z' },
  { id: 'a2', actorId: 'u1', action: 'report_dismissed', targetUserId: 'u4', targetType: 'report', targetId: 'r4', reason: 'Aucune preuve.', metadata: null, createdAt: '2026-09-16T12:00:00Z' },
]

let nextReport = 5
let nextWarning = 2
let nextAudit = 3

const byDateDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

export const moderationMock = {
  createReport: ({ reporterId, targetType, targetId, reason, details, context, snapshot }) => {
    const report = {
      id: `r${nextReport++}`, reporterId, targetType, targetId, reason,
      details: details || null, context: context || null, snapshot: snapshot || null,
      status: 'open', resolution: null, resolvedBy: null, resolvedAt: null, note: null,
      createdAt: new Date().toISOString(),
    }
    reports = [report, ...reports]
    return report
  },
  listReports: (status) => reports.filter((r) => !status || r.status === status).sort(byDateDesc),
  getReport: (id) => reports.find((r) => r.id === id) || null,
  updateReport: (id, patch) => {
    reports = reports.map((r) => (r.id === id ? { ...r, ...patch } : r))
    return reports.find((r) => r.id === id)
  },

  addWarning: (userId, moderatorId, reason) => {
    const warning = { id: `w${nextWarning++}`, userId, moderatorId, reason, createdAt: new Date().toISOString(), acknowledgedAt: null }
    warnings = [warning, ...warnings]
    return warning
  },
  listWarnings: (userId) => warnings.filter((w) => w.userId === userId).sort(byDateDesc),
  listUnacknowledged: (userId) => warnings.filter((w) => w.userId === userId && !w.acknowledgedAt).sort(byDateDesc),
  acknowledge: (userId, warningId) => {
    warnings = warnings.map((w) =>
      w.id === warningId && w.userId === userId ? { ...w, acknowledgedAt: new Date().toISOString() } : w
    )
  },
  countWarningsSince: (ms) => warnings.filter((w) => Date.now() - new Date(w.createdAt).getTime() <= ms).length,

  log: ({ actorId, action, targetUserId = null, targetType = null, targetId = null, reason = null, metadata = null }) => {
    const entry = { id: `a${nextAudit++}`, actorId, action, targetUserId, targetType, targetId, reason, metadata, createdAt: new Date().toISOString() }
    audit = [entry, ...audit]
    return entry
  },
  listAudit: ({ action, targetUserId, actorId } = {}) =>
    audit
      .filter((a) => (!action || a.action === action) && (!targetUserId || a.targetUserId === targetUserId) && (!actorId || a.actorId === actorId))
      .sort(byDateDesc),
}
