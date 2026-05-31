import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('project activity card reuses the shared gradient scrollbar styling', async () => {
  const source = await readFile(new URL('./ProjectActivityCard.tsx', import.meta.url), 'utf8');

  assert.match(
    source,
    /const activityScrollAreaClass = '([^']*\s)?gradient-scroll-area-scrollbar(\s[^']*)?';/
  );
});