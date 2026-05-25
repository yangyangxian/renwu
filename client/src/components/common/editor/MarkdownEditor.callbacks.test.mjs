import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('markdown editor setup does not depend on dirty/value callback identities', async () => {
  const source = await readFile(new URL('./MarkdownEditor.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /\[value,\s*pluginViewFactory,\s*nodeViewFactory,\s*onDirtyChange,\s*onValueChange\]/s);
  assert.match(source, /onDirtyChangeRef\.current\?\./);
  assert.match(source, /onValueChangeRef\.current\?\./);
});