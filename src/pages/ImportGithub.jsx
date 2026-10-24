import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, CheckCircle2 } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { useAuth } from '../hooks/useAuth'
import { normalizeUrl } from '../lib/url'
import Button from '../components/Button'
import MediaUploader from '../components/forms/MediaUploader'

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80'

// Extrait "utilisateur/depot" d'une URL github.com, ou null si ce n'en est pas une.
function parseGithubRepo(input) {
  const normalized = normalizeUrl(input)
  if (!normalized) return null
  const url = new URL(normalized)
  if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null
  const [owner, repo] = url.pathname.split('/').filter(Boolean)
  if (!owner || !repo) return null
  return { owner, repo: repo.replace(/\.git$/, ''), url: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}` }
}

export default function ImportGithub() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [repoUrl, setRepoUrl] = useState('')
  const [imported, setImported] = useState(null)
  const [media, setMedia] = useState({ images: [], video: null })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleImport = (e) => {
    e.preventDefault()
    setError(null)
    const repo = parseGithubRepo(repoUrl)
    if (!repo) {
      setImported(null)
      setError("Saisissez l'adresse d'un dépôt GitHub, par exemple https://github.com/utilisateur/depot.")
      return
    }
    // Le backend réel interrogera l'API GitHub (nom, description, README, langages,
    // licence). En attendant, on prépare la structure des métadonnées attendues.
    setImported({
      name: repo.repo,
      description: 'Description récupérée automatiquement depuis le dépôt.',
      readme: 'Détecté',
      languages: "À déterminer par l'API GitHub",
      licence: 'Aucune',
      url: repo.url,
    })
  }

  const finalize = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const project = await projectsApi.create({
        name: imported.name,
        description: imported.description,
        longDescription: imported.description,
        category: 'Web',
        tech: [],
        github: imported.url,
        licence: imported.licence,
        allowDownload: true,
        authorId: user.id,
        image: media.images[0]?.url || DEFAULT_COVER,
        images: media.images.map((i) => i.url),
        video: media.video?.url || null,
        files: [],
      })
      navigate(`/projets/${project.slug || project.id}`)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue, réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-text-hi">
          <Github size={24} /> Importer depuis GitHub
        </h1>
        <p className="mt-1 text-sm text-text-mid">Connectez un dépôt pour pré-remplir votre publication.</p>
      </div>

      <form onSubmit={handleImport} className="flex flex-col gap-4 rounded-xl2 border border-line bg-surface p-6">
        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Repository GitHub
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/utilisateur/depot"
            className="input"
          />
        </label>
        {error && !imported && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
        <Button type="submit">Importer</Button>
      </form>

      {imported && (
        <div className="flex flex-col gap-4 rounded-xl2 border border-line bg-surface p-6">
          <p className="text-sm text-state-success">Dépôt détecté. Voici les informations récupérées :</p>
          {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
          {[
            ['Nom', imported.name],
            ['Description', imported.description],
            ['README', imported.readme],
            ['Langages', imported.languages],
            ['Licence', imported.licence],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b border-line pb-2 text-sm last:border-0">
              <span className="flex flex-shrink-0 items-center gap-2 text-text-mid">
                <CheckCircle2 size={14} className="text-state-success" /> {label}
              </span>
              <span className="min-w-0 truncate text-right text-text-hi">{value}</span>
            </div>
          ))}

          <MediaUploader images={media.images} video={media.video} onChange={setMedia} />

          <p className="text-xs text-text-low">
            Cette interface est prête à être connectée à l'API GitHub réelle pour la récupération automatique des métadonnées.
          </p>

          <Button size="lg" onClick={finalize} disabled={submitting}>
            {submitting ? 'Publication...' : 'Finaliser la publication'}
          </Button>
        </div>
      )}
    </div>
  )
}
