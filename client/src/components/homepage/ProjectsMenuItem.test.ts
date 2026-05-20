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

test('project row button classes do not force a pointer cursor', async () => {
  const module = await import('./projectRowButtonClassName');

  assert.equal(typeof module.getProjectRowButtonClassName, 'function');
  assert.doesNotMatch(module.getProjectRowButtonClassName(true), /\bcursor-pointer\b/);
  assert.doesNotMatch(module.getProjectRowButtonClassName(false), /\bcursor-pointer\b/);
});

test('project row toggle classes keep the arrow above the row button and show a pointer cursor', async () => {
  const module = await import('./projectRowToggleClassName');

  assert.equal(typeof module.getProjectRowToggleClassName, 'function');
  assert.match(module.getProjectRowToggleClassName(), /\bcursor-pointer\b/);
  assert.match(module.getProjectRowToggleClassName(), /\bz-10\b/);
});