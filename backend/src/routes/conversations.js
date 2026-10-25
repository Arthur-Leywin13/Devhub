import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const conversationsRouter = Router()
conversationsRouter.use(requireAuth)

const messageSchema = z.object({
  body: z.string().trim().min(1, 'Le message ne peut pas être vide.').max(5000, 'Le message est trop long.'),
})
const directConversationSchema = z.object({
  userId: z.string().uuid('Identifiant utilisateur invalide.'),
})
const publicUserSelect = {
  id: true, username: true, name: true, avatarUrl: true, role: true,
}

async function isParticipant(conversationId, userId) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  })
  return Boolean(participant)
}

function serializeMessage(message) {
  return {
    ...message,
    body: message.deletedAt ? 'Message supprimé' : message.body,
  }
}

// Liste les conversations auxquelles l'utilisateur connecté participe.
conversationsRouter.get('/', async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.userId } } },
      include: {
        participants: { include: { user: { select: publicUserSelect } } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: publicUserSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })
    res.json(conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map(serializeMessage),
    })))
  } catch (error) { next(error) }
})

// Crée ou retrouve une conversation privée directe entre deux comptes actifs.
conversationsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = directConversationSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Données invalides.' })
    const otherUserId = parsed.data.userId
    if (otherUserId === req.userId) return res.status(400).json({ message: 'Tu ne peux pas ouvrir une conversation avec toi-même.' })

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, status: true },
    })
    if (!otherUser || otherUser.status !== 'active') {
      return res.status(404).json({ message: 'Utilisateur introuvable ou indisponible.' })
    }

    const directKey = [req.userId, otherUserId].sort().join(':')
    const conversation = await prisma.conversation.upsert({
      where: { directKey },
      update: {},
      create: {
        directKey,
        participants: {
          create: [{ userId: req.userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: { include: { user: { select: publicUserSelect } } },
      },
    })
    res.status(200).json(conversation)
  } catch (error) { next(error) }
})

// Lit les messages. Le contrôle de participation empêche l'accès aux conversations privées d'autrui.
conversationsRouter.get('/:conversationId/messages', async (req, res, next) => {
  try {
    if (!await isParticipant(req.params.conversationId, req.userId)) {
      return res.status(404).json({ message: 'Conversation introuvable.' })
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100)
    const before = typeof req.query.before === 'string' ? req.query.before : null
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: publicUserSelect } },
    })
    res.json(messages.reverse().map(serializeMessage))
  } catch (error) { next(error) }
})

// Envoie un message dans une conversation existante.
conversationsRouter.post('/:conversationId/messages', async (req, res, next) => {
  try {
    const parsed = messageSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Message invalide.' })
    if (!await isParticipant(req.params.conversationId, req.userId)) {
      return res.status(404).json({ message: 'Conversation introuvable.' })
    }
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: req.params.conversationId,
          senderId: req.userId,
          body: parsed.data.body,
        },
        include: { sender: { select: publicUserSelect } },
      })
      await tx.conversation.update({
        where: { id: req.params.conversationId },
        data: { updatedAt: new Date() },
      })
      return created
    })
    res.status(201).json(serializeMessage(message))
  } catch (error) { next(error) }
})

// Seul l'auteur peut modifier son message; la route ne révèle pas les messages d'autres comptes.
conversationsRouter.patch('/messages/:messageId', async (req, res, next) => {
  try {
    const parsed = messageSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Message invalide.' })
    const existing = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        senderId: req.userId,
        deletedAt: null,
        conversation: { participants: { some: { userId: req.userId } } },
      },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ message: 'Message introuvable.' })
    const message = await prisma.message.update({
      where: { id: existing.id },
      data: { body: parsed.data.body, editedAt: new Date() },
      include: { sender: { select: publicUserSelect } },
    })
    res.json(serializeMessage(message))
  } catch (error) { next(error) }
})

// Suppression logique : conserve le fil de discussion sans exposer le contenu supprimé.
conversationsRouter.delete('/messages/:messageId', async (req, res, next) => {
  try {
    const existing = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        senderId: req.userId,
        deletedAt: null,
        conversation: { participants: { some: { userId: req.userId } } },
      },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ message: 'Message introuvable.' })
    await prisma.message.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    })
    res.json({ deleted: true })
  } catch (error) { next(error) }
})

// Marque la conversation comme lue pour l'utilisateur courant.
conversationsRouter.patch('/:conversationId/read', async (req, res, next) => {
  try {
    const updated = await prisma.conversationParticipant.updateMany({
      where: { conversationId: req.params.conversationId, userId: req.userId },
      data: { lastReadAt: new Date() },
    })
    if (!updated.count) return res.status(404).json({ message: 'Conversation introuvable.' })
    res.json({ read: true })
  } catch (error) { next(error) }
})
