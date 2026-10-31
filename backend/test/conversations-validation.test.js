import test from 'node:test'
import assert from 'node:assert/strict'
import { directConversationSchema, isUuid, messageSchema } from '../src/validation/conversations.js'

test('accepts a non-empty message and trims surrounding whitespace', () => {
  assert.deepEqual(messageSchema.parse({ body: '  Salut  ' }), { body: 'Salut' })
})

test('rejects empty messages and messages over 5000 characters', () => {
  assert.equal(messageSchema.safeParse({ body: '   ' }).success, false)
  assert.equal(messageSchema.safeParse({ body: 'x'.repeat(5001) }).success, false)
})

test('accepts only a UUID for the other participant', () => {
  assert.equal(directConversationSchema.safeParse({ userId: '8c2e5c10-6a6e-4b45-a6d7-0c3f4f8f9b21' }).success, true)
  assert.equal(directConversationSchema.safeParse({ userId: 'not-a-uuid' }).success, false)
})

test('validates conversation IDs and pagination cursors as UUIDs', () => {
  assert.equal(isUuid('8c2e5c10-6a6e-4b45-a6d7-0c3f4f8f9b21'), true)
  assert.equal(isUuid('undefined'), false)
  assert.equal(isUuid(''), false)
})
