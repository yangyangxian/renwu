import test from 'node:test';
import assert from 'node:assert/strict';

test('project rows with saved views reserve inline space for the collapse arrow', async () => {
  const module = await import('./projectRowButtonClassName');

  assert.equal(typeof module.getProjectRowButtonClassName, 'function');
  assert.match(module.getProjectRowButtonClassName(true), /\bpr-8\b/);
});

test('project rows without saved views do not reserve arrow spacing', async () => {
  const module = await import('./projectRowButtonClassName');

  assert.equal(typeof module.getProjectRowButtonClassName, 'function');
  assert.doesNotMatch(module.getProjectRowButtonClassName(false), /\bpr-8\b/);
});