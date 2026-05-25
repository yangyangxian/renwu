import test from 'node:test';
import assert from 'node:assert/strict';

test('comment composer submit is disabled for empty content even after edits', async () => {
  const module = await import('./TaskCommentsSection');

  assert.equal(module.hasMeaningfulCommentContent(''), false);
  assert.equal(module.hasMeaningfulCommentContent('   \n\n  '), false);
  assert.equal(module.hasMeaningfulCommentContent('hello'), true);

  assert.equal(module.shouldEnableCommentComposerSubmit({ dirty: false, content: 'hello' }), false);
  assert.equal(module.shouldEnableCommentComposerSubmit({ dirty: true, content: '   ' }), false);
  assert.equal(module.shouldEnableCommentComposerSubmit({ dirty: true, content: 'hello' }), true);
});