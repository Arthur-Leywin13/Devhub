import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import { useCategories } from '../hooks/useTechnologies'
import { articlesApi } from '../api/articles'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'

export default function WriteArticle() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: categories } = useCategories()
  const [form, setForm] = useState({ title: '', category: '', excerpt: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const article = await articlesApi.create({
        ...form,
        category: form.category || categories?.[0]?.name || 'Programmation',
        authorId: user.id,
        readTime: Math.max(1, Math.round(form.content.split(' ').length / 200)),
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
      })
      navigate(`/articles/${article.slug || article.id}`)
    } catch (err) {
      setError(err.message || "Une erreur est survenue, réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Écrire un article</h1>
        <p className="mt-1 text-sm text-text-mid">Contribuez à l'encyclopédie DevHub.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl2 border border-line bg-surface p-6">
        {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Titre
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre de l'article"
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Catégorie
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {(categories || []).map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Résumé
          <textarea
            required
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Une phrase qui résume l'article"
            className="input resize-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-text-mid">
          Contenu
          <textarea
            required
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Rédigez votre article..."
            className="input resize-none"
          />
        </label>

        <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-6 text-sm text-text-mid hover:border-accent-blue/50 hover:text-text-hi">
          <ImagePlus size={18} /> Ajouter une image de couverture
        </button>

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Publication...' : "Publier l'article"}
        </Button>
      </form>
    </div>
  )
}
