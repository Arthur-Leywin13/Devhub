import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Globe } from 'lucide-react'
import { useTechnologies } from '../hooks/useTechnologies'
import { projectsApi } from '../api/projects'
import { useAuth } from '../hooks/useAuth'
import { normalizeUrl } from '../lib/url'
import Button from '../components/Button'
import MediaUploader from '../components/forms/MediaUploader'
import FileUploader from '../components/forms/FileUploader'

const categories = ['Bots', 'IA', 'Mobile', 'Web', 'Productivité', 'DevOps', 'Jeux']
// Couverture utilisée quand l'auteur n'a ajouté aucune image.
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80'

export default function PublishProject() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: technologies } = useTechnologies()
  const [form, setForm] = useState({ name: '', description: '', category: categories[0], licence: 'Aucune', github: '', demo: '' })
  const [selectedTech, setSelectedTech] = useState([])
  const [media, setMedia] = useState({ images: [], video: null })
  const [files, setFiles] = useState([])
  const [allowDownload, setAllowDownload] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const toggleTech = (id) => {
    setSelectedTech((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const github = form.github.trim() ? normalizeUrl(form.github) : null
    const demo = form.demo.trim() ? normalizeUrl(form.demo) : null
    if (form.github.trim() && !github) return setError('Le lien GitHub est invalide.')
    if (form.demo.trim() && !demo) return setError('Le lien de démo est invalide.')

    setSubmitting(true)
    try {
      const project = await projectsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        longDescription: form.description.trim(),
        category: form.category,
        licence: form.licence,
        github,
        demo,
        authorId: user.id,
        tech: selectedTech,
        allowDownload,
        image: media.images[0]?.url || DEFAULT_COVER,
        images: media.images.map((i) => i.url),
        video: media.video?.url || null,
        files,
      })
      navigate(`/projets/${project.slug || project.id}`)
    } catch (err) {
      setError(err.message || 'La publication a échoué, réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Publier un projet</h1>
        <p className="mt-1 text-sm text-text-mid">Partagez votre travail avec la communauté DevHub.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl2 border border-line bg-surface p-6">
        {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}

        <Field label="Nom du projet">
          <input
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ex: Gestionnaire de tâches"
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez ce que fait votre projet..."
            className="input resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Catégorie">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Licence">
            <select className="input" value={form.licence} onChange={(e) => setForm({ ...form, licence: e.target.value })}>
              <option>Aucune</option>
              <option>MIT</option>
              <option>Apache 2.0</option>
              <option>GPL v3</option>
              <option>Propriétaire</option>
            </select>
          </Field>
        </div>

        <Field label="Technologies">
          <div className="flex flex-wrap gap-2">
            {(technologies || []).map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => toggleTech(t.id)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
                  selectedTech.includes(t.id)
                    ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                    : 'border-line bg-surface-raised text-text-mid hover:text-text-hi'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Images et vidéo">
          <MediaUploader images={media.images} video={media.video} onChange={setMedia} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lien GitHub">
            <div className="input flex items-center gap-2">
              <Github size={15} className="text-text-low" />
              <input
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                placeholder="https://github.com/..."
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
          </Field>
          <Field label="Lien démo">
            <div className="input flex items-center gap-2">
              <Globe size={15} className="text-text-low" />
              <input
                value={form.demo}
                onChange={(e) => setForm({ ...form, demo: e.target.value })}
                placeholder="https://..."
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
          </Field>
        </div>

        <Field label="Fichiers">
          <FileUploader files={files} onChange={setFiles} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-text-mid">
          <input type="checkbox" checked={allowDownload} onChange={() => setAllowDownload((v) => !v)} className="h-4 w-4 rounded border-line accent-accent-blue" />
          Autoriser le téléchargement
        </label>

        <Button type="submit" size="lg" className="mt-2" disabled={submitting}>
          {submitting ? 'Publication...' : 'Publier'}
        </Button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-text-mid">
      <span>{label}</span>
      {children}
    </div>
  )
}
