// Partage natif quand disponible (mobile), sinon copie du lien dans le presse-papiers.
// Renvoie 'shared' | 'copied' | 'cancelled' | 'failed'.
export async function shareLink({ title, text, url }) {
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: fullUrl })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(fullUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}
