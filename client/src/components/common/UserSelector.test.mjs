import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('user selector popover clips its corners and option rows do not add nested rounded grey corners', async () => {
  const source = await readFile(new URL('./UserSelector.tsx', import.meta.url), 'utf8');

  assert.match(source, /<PopoverContent className="[^"]*overflow-hidden[^"]*"/);
  assert.match(source, /className="[^"]*rounded-none[^"]*shadow-none[^"]*"/);
});