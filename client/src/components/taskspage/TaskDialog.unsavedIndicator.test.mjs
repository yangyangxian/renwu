import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('task dialog renders the description unsaved indicator in the description header instead of the footer', async () => {
  const source = await readFile(new URL('./TaskDialog.tsx', import.meta.url), 'utf8');

  assert.match(source, /showDescriptionUnsavedIndicator/);
  assert.match(source, /Description[\s\S]*UnsavedChangesIndicator/);
  assert.match(source, /pointer-events-none opacity-0/);
  assert.doesNotMatch(source, /border-t bg-background[\s\S]*isDirty &&/);
});

test('task dialog description unsaved indicator only shows for meaningful content changes', async () => {
  const module = await import('./TaskDialog');

  assert.equal(module.shouldShowTaskDialogDescriptionUnsavedIndicator({ initialDescription: '', currentDescription: '   ' }), false);
  assert.equal(module.shouldShowTaskDialogDescriptionUnsavedIndicator({ initialDescription: '', currentDescription: 'hello' }), true);
  assert.equal(module.shouldShowTaskDialogDescriptionUnsavedIndicator({ initialDescription: 'hello', currentDescription: ' hello  ' }), false);
  assert.equal(module.shouldShowTaskDialogDescriptionUnsavedIndicator({ initialDescription: 'hello', currentDescription: '' }), true);
});