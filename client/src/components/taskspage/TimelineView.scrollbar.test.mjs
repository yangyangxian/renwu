import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('timeline rails reuse the shared gradient scrollbar styling', async () => {
  const source = await readFile(new URL('./TimelineView.tsx', import.meta.url), 'utf8');

  const matches = source.match(/gradient-scroll-area-scrollbar/g) ?? [];
  assert.ok(matches.length >= 2, 'expected both timeline rails to include the shared scrollbar class');
});