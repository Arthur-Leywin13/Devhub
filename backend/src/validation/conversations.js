import { z } from 'zod'

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Le message ne peut pas être vide.').max(5000, 'Le message est trop long.'),
})

export const directConversationSchema = z.object({
  userId: z.string().uuid('Identifiant utilisateur invalide.'),
})

export function isUuid(value) {
  return z.string().uuid().safeParse(value).success
}
