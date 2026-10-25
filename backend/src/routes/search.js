import { Router } from 'express'
import { prisma } from '../db/prisma.js'

export const searchRouter = Router()

// Articles, courses and technologies will be connected when their database models are added.
// Keep the response shape stable for the current Explore page.
searchRouter.get('/', async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : ''
    const category = typeof req.query.category === 'string' ? req.query.category.slice(0, 80) : ''
    if (query.length < 1) {
      return res.json({ projects: [], articles: [], users: [], technologies: [], courses: [] })
    }
    const [projects, users] = await Promise.all([
      prisma.project.findMany({
        where: {
          ...(category ? { category } : {}),
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tech: { has: query } },
          ],
        },
        select: {
          id: true, slug: true, name: true, description: true, image: true,
          images: true, authorId: true, tech: true, category: true, github: true,
          demo: true, likesCount: true, commentsCount: true, stars: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.user.findMany({
        where: {
          status: 'active',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, username: true, name: true, avatarUrl: true, bio: true,
          role: true, followersCount: true, followingCount: true, createdAt: true,
        },
        orderBy: [{ followersCount: 'desc' }, { username: 'asc' }],
        take: 30,
      }),
    ])
    res.json({ projects, articles: [], users, technologies: [], courses: [] })
  } catch (error) { next(error) }
})
