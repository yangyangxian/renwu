import test from 'node:test';
import assert from 'node:assert/strict';

import { getEditableTaskTableRowClassName } from './taskTableRowStyles';

test('getEditableTaskTableRowClassName keeps the light hover surface but disables dark row background changes', () => {
  const className = getEditableTaskTableRowClassName();

  assert.match(className, /hover:bg-muted\/30/);
  assert.match(className, /dark:hover:bg-background/);
});