import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, GripVertical, X, Video, Loader2, Trash2 } from 'lucide-react'
import { coursesApi } from '../api/courses'
import { useAuth } from '../hooks/useAuth'
import { uploadAttachment, validateFile } from '../lib/attachments'
import Button from '../components/Button'

const levels = ['Débutant', 'Intermédiaire', 'Avancé']
const lessonTypes = [
  { id: 'VIDEO', label: 'Vidéo' },
  { id: 'TEXT', label: 'Texte' },
  { id: 'VIDEO_TEXT', label: 'Vidéo + Texte' },
]
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'

const newLesson = () => ({ title: '', type: 'VIDEO', content: '', video: null })
const newSection = () => ({ title: '', lessons: [newLesson()] })

export default function CreateCourse() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', category: 'Programmation', level: levels[0] })
  const [sections, setSections] = useState([newSection()])
  const [uploadingKey, setUploadingKey] = useState(null) // "sIdx-lIdx" de la leçon en cours d'envoi
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const videoInputs = useRef({})

  const updateSection = (i, patch) => setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)))
  const updateLesson = (sIdx, lIdx, patch) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx !== sIdx ? sec : { ...sec, lessons: sec.lessons.map((l, li) => (li === lIdx ? { ...l, ...patch } : l)) }
      )
    )
  const addSection = () => setSections((s) => [...s, newSection()])
  const removeSection = (sIdx) => setSections((s) => (s.length > 1 ? s.filter((_, idx) => idx !== sIdx) : s))
  const addLesson = (sIdx) =>
    setSections((s) => s.map((sec, idx) => (idx !== sIdx ? sec : { ...sec, lessons: [...sec.lessons, newLesson()] })))
  const removeLesson = (sIdx, lIdx) =>
    setSections((s) =>
      s.map((sec, idx) =>
        idx !== sIdx || sec.lessons.length <= 1 ? sec : { ...sec, lessons: sec.lessons.filter((_, li) => li !== lIdx) }
      )
    )

  const handleVideo = (sIdx, lIdx) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateFile(file, ['video'])
    if (problem) return setError(problem)
    setError(null)
    setUploadingKey(`${sIdx}-${lIdx}`)
    try {
      const attachment = await uploadAttachment(file, 'lesson-video')
      updateLesson(sIdx, lIdx, { video: attachment })
    } catch (err) {
      setError(err.message || "L'envoi de la vidéo a échoué.")
    } finally {
      setUploadingKey(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (uploadingKey) return
    setSubmitting(true)
    setError(null)
    try {
      const course = await coursesApi.create({ ...form, authorId: user.id, image: DEFAULT_COVER })
      for (const section of sections) {
        if (!section.title.trim()) continue
        const createdSection = await coursesApi.addSection(course.id, section.title.trim())
        for (const lesson of section.lessons) {
          if (!lesson.title.trim()) continue
          const hasVideo = lesson.type === 'VIDEO' || lesson.type === 'VIDEO_TEXT'
          const hasText = lesson.type === 'TEXT' || lesson.type === 'VIDEO_TEXT'
          await coursesApi.addLesson(course.id, createdSection.id, {
            title: lesson.title.trim(),
            type: lesson.type,
            content: hasText ? lesson.content.trim() : '',
            videoUrl: hasVideo ? lesson.video?.url || null : null,
          })
        }
      }
      navigate(`/cours/${course.slug || course.id}`)
    } catch (err) {
      setError(err.message || "Une erreur est survenue, réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-hi">Créer un cours</h1>
        <p className="mt-1 text-sm text-text-mid">Structurez votre cours en sections et en leçons (vidéo, texte ou les deux).</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}

        <div className="flex flex-col gap-4 rounded-xl2 border border-line bg-surface p-6">
          <label className="flex flex-col gap-1.5 text-sm text-text-mid">
            Titre du cours
            <input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="ex: Fondamentaux de Node.js" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-text-mid">
            Description
            <textarea required rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-text-mid">
              Catégorie
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-mid">
              Niveau
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="input">
                {levels.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="rounded-xl2 border border-line bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={section.title}
                  onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                  placeholder={`Titre de la section ${sIdx + 1}`}
                  className="input flex-1 font-medium"
                />
                {sections.length > 1 && (
                  <button type="button" onClick={() => removeSection(sIdx)} aria-label="Supprimer la section" className="rounded-lg p-2 text-text-low hover:bg-state-danger/10 hover:text-state-danger">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {section.lessons.map((lesson, lIdx) => {
                  const key = `${sIdx}-${lIdx}`
                  const needsVideo = lesson.type === 'VIDEO' || lesson.type === 'VIDEO_TEXT'
                  const needsText = lesson.type === 'TEXT' || lesson.type === 'VIDEO_TEXT'
                  return (
                    <div key={lIdx} className="flex flex-col gap-2 rounded-xl border border-line bg-surface-raised p-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={15} className="hidden flex-shrink-0 text-text-low sm:block" />
                        <input
                          value={lesson.title}
                          onChange={(e) => updateLesson(sIdx, lIdx, { title: e.target.value })}
                          placeholder="Titre de la leçon"
                          className="input min-w-0 flex-1"
                        />
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(sIdx, lIdx, { type: e.target.value })}
                          className="input w-32 flex-shrink-0 sm:w-40"
                        >
                          {lessonTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        {section.lessons.length > 1 && (
                          <button type="button" onClick={() => removeLesson(sIdx, lIdx)} aria-label="Supprimer la leçon" className="flex-shrink-0 text-text-low hover:text-state-danger">
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {needsVideo && (
                        <div className="flex flex-col gap-2">
                          <input
                            ref={(el) => { videoInputs.current[key] = el }}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideo(sIdx, lIdx)}
                          />
                          {lesson.video ? (
                            <div className="relative overflow-hidden rounded-lg border border-line bg-black">
                              <video src={lesson.video.url} controls preload="metadata" className="aspect-video w-full" />
                              <button
                                type="button"
                                onClick={() => updateLesson(sIdx, lIdx, { video: null })}
                                aria-label="Retirer la vidéo"
                                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-state-danger"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => videoInputs.current[key]?.click()}
                              disabled={uploadingKey === key}
                              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-line py-4 text-sm text-text-mid transition-colors hover:border-accent-blue/50 hover:text-text-hi disabled:opacity-50"
                            >
                              {uploadingKey === key ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                              {uploadingKey === key ? 'Envoi de la vidéo...' : 'Ajouter la vidéo de la leçon'}
                            </button>
                          )}
                        </div>
                      )}

                      {needsText && (
                        <textarea
                          value={lesson.content}
                          onChange={(e) => updateLesson(sIdx, lIdx, { content: e.target.value })}
                          rows={4}
                          maxLength={20000}
                          placeholder="Contenu de la leçon..."
                          className="input resize-y"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <button type="button" onClick={() => addLesson(sIdx)} className="mt-3 flex items-center gap-1.5 text-xs text-accent-blue hover:underline">
                <Plus size={13} /> Ajouter une leçon
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSection}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-4 text-sm text-text-mid hover:border-accent-blue/50 hover:text-text-hi"
          >
            <Plus size={16} /> Ajouter une section
          </button>
        </div>

        <Button type="submit" size="lg" disabled={submitting || !!uploadingKey}>
          {submitting ? 'Création...' : 'Créer le cours'}
        </Button>
      </form>
    </div>
  )
}
