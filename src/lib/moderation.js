// Libellés et constantes partagés par le signalement (côté utilisateur) et
// l'espace d'administration.

export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam ou publicité' },
  { id: 'harassment', label: 'Harcèlement ou propos haineux' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
  { id: 'impersonation', label: "Usurpation d'identité" },
  { id: 'illegal', label: 'Contenu illégal' },
  { id: 'other', label: 'Autre' },
]
export const reasonLabel = (id) => REPORT_REASONS.find((r) => r.id === id)?.label || id

export const TARGET_LABELS = {
  user: 'Utilisateur', project: 'Projet', article: 'Article', post: 'Publication',
  comment: 'Commentaire', message: 'Message privé', course: 'Cours',
}

export const AUDIT_LABELS = {
  warn: 'Avertissement',
  suspend: 'Suspension',
  ban: 'Bannissement',
  unsuspend: 'Levée de suspension',
  unban: 'Levée de bannissement',
  role_change: 'Changement de rôle',
  delete_content: 'Contenu supprimé',
  report_resolved: 'Signalement traité',
  report_dismissed: 'Signalement rejeté',
}

export const STATUS_LABELS = { active: 'Actif', suspended: 'Suspendu', banned: 'Banni' }
export const SUSPENSION_DURATIONS = [1, 3, 7, 14, 30, 90]
export const MIN_REASON_LENGTH = 5
export const MAX_REASON_LENGTH = 500
