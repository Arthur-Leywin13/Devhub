import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const coursesRouter = Router()

const authorSelect = { id: true, username: true, name: true, avatarUrl: true, role: true }
const courseInclude = {
  author: { select: authorSelect },
  sections: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' } } } },
}
const courseInput = z.object({
  title: z.string().trim().min(5).max(180),
  description: z.string().trim().min(10).max(1000),
  image: z.string().url().max(2048).nullable().optional(),
  category: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(40),
})
const sectionInput = z.object({ title: z.string().trim().min(2).max(180) })
const lessonInput = z.object({
  sectionId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  type: z.enum(['TEXT', 'VIDEO', 'VIDEO_TEXT']).default('TEXT'),
  content: z.string().max(50000).nullable().optional(),
  videoUrl: z.string().url().max(2048).nullable().optional(),
  durationMin: z.number().int().min(1).max(600).nullable().optional(),
})

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140) || 'cours'
}
function webUrl(value) {
  if (!value) return
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('URL non autorisée.'), { status: 400 })
}
async function getCourse(id) {
  return prisma.course.findFirst({ where: { OR: [{ id }, { slug: id }] }, include: courseInclude })
}
async function canEdit(course, userId) {
  if (course.authorId === userId) return true
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return ['admin', 'moderator'].includes(user?.role)
}

coursesRouter.get('/', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : ''
    const courses = await prisma.course.findMany({
      where: {
        published: true,
        ...(req.query.authorId ? { authorId: String(req.query.authorId) } : {}),
        ...(req.query.category ? { category: String(req.query.category) } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
        author: { status: 'active' },
      },
      select: { id: true, slug: true, title: true, description: true, image: true, category: true, level: true, authorId: true, studentsCount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Number(req.query.limit) || 30, 1), 50),
    })
    res.json(courses)
  } catch (error) { next(error) }
})

coursesRouter.get('/:id/progress', requireAuth, async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id)
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' })
    const progress = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId: req.userId, courseId: course.id } },
    })
    const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0)
    const completedLessonIds = progress?.completedLessonIds || []
    res.json({ completedLessonIds, totalLessons, percent: totalLessons ? Math.round(completedLessonIds.length / totalLessons * 100) : 0 })
  } catch (error) { next(error) }
})

coursesRouter.get('/:courseId/lessons/:lessonId', async (req, res, next) => {
  try {
    const lesson = await prisma.courseLesson.findFirst({
      where: { id: req.params.lessonId, section: { course: { OR: [{ id: req.params.courseId }, { slug: req.params.courseId }], published: true } } },
      include: { section: { select: { courseId: true } } },
    })
    if (!lesson) return res.status(404).json({ message: 'Leçon introuvable.' })
    const { section, ...data } = lesson
    res.json({ ...data, courseId: section.courseId })
  } catch (error) { next(error) }
})

coursesRouter.get('/:id', async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id)
    if (!course || !course.published) return res.status(404).json({ message: 'Cours introuvable.' })
    const { published, updatedAt, ...publicCourse } = course
    res.json(publicCourse)
  } catch (error) { next(error) }
})

coursesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsed = courseInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Cours invalide.' })
    webUrl(parsed.data.image)
    const base = slugify(parsed.data.title)
    const slug = `${base}-${Date.now().toString(36)}`
    const course = await prisma.course.create({
      data: { ...parsed.data, slug, authorId: req.userId },
      include: courseInclude,
    })
    res.status(201).json(course)
  } catch (error) { next(error) }
})

coursesRouter.post('/:id/sections', requireAuth, async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id)
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' })
    if (!await canEdit(course, req.userId)) return res.status(403).json({ message: 'Modification non autorisée.' })
    const parsed = sectionInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Titre de section invalide.' })
    const section = await prisma.courseSection.create({
      data: { courseId: course.id, title: parsed.data.title, position: course.sections.length },
      include: { lessons: true },
    })
    res.status(201).json(section)
  } catch (error) { next(error) }
})

coursesRouter.post('/:id/lessons', requireAuth, async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id)
    if (!course) return res.status(404).json({ message: 'Cours introuvable.' })
    if (!await canEdit(course, req.userId)) return res.status(403).json({ message: 'Modification non autorisée.' })
    const parsed = lessonInput.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Leçon invalide.' })
    const section = course.sections.find((item) => item.id === parsed.data.sectionId)
    if (!section) return res.status(404).json({ message: 'Section introuvable dans ce cours.' })
    webUrl(parsed.data.videoUrl)
    const { sectionId, ...data } = parsed.data
    const lesson = await prisma.courseLesson.create({
      data: { ...data, sectionId, position: section.lessons.length },
    })
    res.status(201).json(lesson)
  } catch (error) { next(error) }
})

coursesRouter.post('/:courseId/lessons/:lessonId/complete', requireAuth, async (req, res, next) => {
  try {
    const course = await getCourse(req.params.courseId)
    if (!course || !course.published) return res.status(404).json({ message: 'Cours introuvable.' })
    const lesson = course.sections.flatMap((section) => section.lessons).find((item) => item.id === req.params.lessonId)
    if (!lesson) return res.status(404).json({ message: 'Leçon introuvable dans ce cours.' })
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.courseProgress.findUnique({ where: { userId_courseId: { userId: req.userId, courseId: course.id } } })
      const completedLessonIds = current?.completedLessonIds || []
      const wasEnrolled = Boolean(current)
      const nextIds = completedLessonIds.includes(lesson.id) ? completedLessonIds : [...completedLessonIds, lesson.id]
      await tx.courseProgress.upsert({
        where: { userId_courseId: { userId: req.userId, courseId: course.id } },
        create: { userId: req.userId, courseId: course.id, completedLessonIds: nextIds },
        update: { completedLessonIds: nextIds },
      })
      if (!wasEnrolled) await tx.course.update({ where: { id: course.id }, data: { studentsCount: { increment: 1 } } })
      return nextIds
    })
    const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0)
    res.json({ completedLessonIds: result, totalLessons, percent: totalLessons ? Math.round(result.length / totalLessons * 100) : 0 })
  } catch (error) { next(error) }
})
