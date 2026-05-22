import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('wiki document surfaces reuse the shared gradient scrollbar styling', async () => {
  const source = await readFile(new URL('./ProjectDocumentsCard.tsx', import.meta.url), 'utf8');

  assert.match(
    source,
    /const editDocumentSurfaceClass = '([^']*\s)?gradient-scroll-area-scrollbar(\s[^']*)?';/
  );
  assert.match(
    source,
    /const viewDocumentSurfaceClass = '([^']*\s)?gradient-scroll-area-scrollbar(\s[^']*)?';/
  );
});