import test from 'node:test'
import assert from 'node:assert/strict'
import { reportSchema, reportResolutionSchema, roleChangeSchema } from '../src/validation/moderation.js'

const id = '8c2e5c10-6a6e-4b45-a6d7-0c3f4f8f9b21'

test('valid report input is accepted', () => {
  assert.equal(reportSchema.safeParse({ targetType: 'article', targetId: id, reason: 'spam', details: 'Repeated content' }).success, true)
})

test('invalid report type, reason and context are rejected', () => {
  assert.equal(reportSchema.safeParse({ targetType: 'unknown', targetId: id, reason: 'spam' }).success, false)
  assert.equal(reportSchema.safeParse({ targetType: 'post', targetId: id, reason: 'unknown' }).success, false)
  assert.equal(reportSchema.safeParse({ targetType: 'message', targetId: id, reason: 'harassment', context: { conversationId: 'bad' } }).success, false)
})

test('only supported roles are accepted', () => {
  assert.equal(roleChangeSchema.safeParse({ role: 'moderator' }).success, true)
  assert.equal(roleChangeSchema.safeParse({ role: 'owner' }).success, false)
})

test('suspension requires a duration from 1 to 365 days', () => {
  assert.equal(reportResolutionSchema.safeParse({ action: 'suspend', reason: 'Repeated rule violation' }).success, false)
  assert.equal(reportResolutionSchema.safeParse({ action: 'suspend', reason: 'Repeated rule violation', durationDays: 7 }).success, true)
  assert.equal(reportResolutionSchema.safeParse({ action: 'suspend', reason: 'Repeated rule violation', durationDays: 366 }).success, false)
})

test('non-suspension resolutions do not require a duration', () => {
  assert.equal(reportResolutionSchema.safeParse({ action: 'warn', reason: 'Inappropriate behavior' }).success, true)
  assert.equal(reportResolutionSchema.safeParse({ action: 'delete_content', reason: 'Content violates the rules' }).success, true)
})
