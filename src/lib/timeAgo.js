export function timeAgo(isoDate) {
  if (!isoDate) return ''
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} sem.`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`
  const years = Math.floor(days / 365)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

export function formatDateTime(isoDate) {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}
