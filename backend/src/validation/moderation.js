import { z } from 'zod'

export const roles = ['user', 'creator', 'moderator', 'admin']
export const reportTypes = ['user', 'project', 'article', 'post', 'comment', 'message', 'course']
export const reportReasons = ['spam', 'harassment', 'inappropriate', 'impersonation', 'copyright', 'dangerous', 'other']

export const reportSchema = z.object({
  targetType: z.enum(reportTypes),
  targetId: z.string().uuid(),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(500).optional(),
  context: z.object({ conversationId: z.string().uuid() }).optional(),
})

export const roleChangeSchema = z.object({
  role: z.enum(roles),
})

export const reportResolutionSchema = z.object({
  action: z.enum(['warn', 'suspend', 'ban', 'delete_content']),
  reason: z.string().trim().min(5).max(500),
  durationDays: z.number().int().min(1).max(365).optional(),
  deleteContent: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.action === 'suspend' && value.durationDays === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['durationDays'],
      message: 'Durée de suspension obligatoire.',
    })
  }
})
