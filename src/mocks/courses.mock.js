// MOCK TEMPORAIRE — à supprimer lorsque le backend réel est branché.
// Structure alignée sur : GET /courses, GET /courses/:id, GET /courses/:id/progress,
// POST /courses/:courseId/lessons/:lessonId/complete

let courses = [
  {
    id: 'c1',
    slug: 'cours-exemple-fondamentaux-node',
    title: 'Cours exemple — Fondamentaux de Node.js',
    description: "Apprenez les bases du runtime Node.js : modules, événements, fichiers et serveur HTTP.",
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    authorId: 'u1',
    category: 'Programmation',
    level: 'Débutant',
    studentsCount: 0,
    sections: [
      {
        id: 's1',
        title: 'Introduction',
        lessons: [
          { id: 'l1', title: 'Présentation du runtime', type: 'VIDEO', videoUrl: null, durationMin: 6 },
          { id: 'l2', title: 'Installer son environnement', type: 'TEXT', content: 'Contenu de leçon d\'exemple : étapes d\'installation de Node.js et d\'un éditeur de code.' },
        ],
      },
      {
        id: 's2',
        title: 'Modules et fichiers',
        lessons: [
          { id: 'l3', title: 'Le système de modules', type: 'VIDEO_TEXT', videoUrl: null, content: 'Contenu de leçon d\'exemple sur CommonJS et les modules ES.', durationMin: 9 },
        ],
      },
    ],
  },
  {
    id: 'c2',
    slug: 'cours-exemple-bases-ia-appliquee',
    title: 'Cours exemple — Bases de l\'IA appliquée',
    description: "Comprendre les grands principes du machine learning et des modèles de langage.",
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
    authorId: 'u4',
    category: 'IA',
    level: 'Intermédiaire',
    studentsCount: 0,
    sections: [
      {
        id: 's1',
        title: 'Notions de base',
        lessons: [
          { id: 'l1', title: 'Qu\'est-ce qu\'un modèle ?', type: 'TEXT', content: 'Contenu de leçon d\'exemple expliquant les modèles statistiques.' },
        ],
      },
    ],
  },
]

// Progression par utilisateur : { userId, courseId, completedLessonIds: [] }
let progress = []

let nextCourseId = 3

export const coursesMock = {
  list: (params = {}) => {
    let result = [...courses]
    if (params.authorId) result = result.filter((c) => c.authorId === params.authorId)
    if (params.category) result = result.filter((c) => c.category === params.category)
    if (params.q) result = result.filter((c) => c.title.toLowerCase().includes(params.q.toLowerCase()))
    return result.map(({ sections, ...rest }) => rest)
  },
  getById: (id) => courses.find((c) => c.id === id || c.slug === id) || null,
  getLesson: (courseId, lessonId) => {
    const course = courses.find((c) => c.id === courseId || c.slug === courseId)
    if (!course) return null
    for (const section of course.sections) {
      const lesson = section.lessons.find((l) => l.id === lessonId)
      if (lesson) return { ...lesson, courseId: course.id, sectionId: section.id }
    }
    return null
  },
  create: (data) => {
    const course = {
      id: `c${nextCourseId++}`,
      slug: (data.title || 'cours').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      studentsCount: 0,
      sections: [],
      ...data,
    }
    courses = [course, ...courses]
    return course
  },
  addSection: (courseId, title) => {
    let newSection
    courses = courses.map((c) => {
      if (c.id !== courseId) return c
      newSection = { id: `s${c.sections.length + 1}`, title, lessons: [] }
      return { ...c, sections: [...c.sections, newSection] }
    })
    return newSection
  },
  addLesson: (courseId, sectionId, lessonData) => {
    let newLesson
    courses = courses.map((c) => {
      if (c.id !== courseId) return c
      return {
        ...c,
        sections: c.sections.map((s) => {
          if (s.id !== sectionId) return s
          newLesson = { id: `l${s.lessons.length + 1}`, ...lessonData }
          return { ...s, lessons: [...s.lessons, newLesson] }
        }),
      }
    })
    return newLesson
  },
  getProgress: (userId, courseId) => {
    const entry = progress.find((p) => p.userId === userId && p.courseId === courseId)
    const course = courses.find((c) => c.id === courseId || c.slug === courseId)
    const totalLessons = course ? course.sections.reduce((sum, s) => sum + s.lessons.length, 0) : 0
    const completedLessonIds = entry ? entry.completedLessonIds : []
    return {
      completedLessonIds,
      totalLessons,
      percent: totalLessons ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0,
    }
  },
  completeLesson: (userId, courseId, lessonId) => {
    const course = courses.find((c) => c.id === courseId || c.slug === courseId)
    const resolvedId = course ? course.id : courseId
    let entry = progress.find((p) => p.userId === userId && p.courseId === resolvedId)
    if (!entry) {
      entry = { userId, courseId: resolvedId, completedLessonIds: [] }
      progress.push(entry)
    }
    if (!entry.completedLessonIds.includes(lessonId)) {
      entry.completedLessonIds.push(lessonId)
    }
    return coursesMock.getProgress(userId, resolvedId)
  },
  remove: (id) => {
    courses = courses.filter((c) => c.id !== id)
  },
}
