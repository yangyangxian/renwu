import test from 'node:test';
import assert from 'node:assert/strict';

test('task table row click ignores dropdown menu controls', async () => {
  const module = await import('./EditableTaskTableRow');

  const dropdownTarget = {
    closest: (selector: string) => selector.includes('[data-slot^="dropdown-menu"]') ? {} : null,
  } as Pick<HTMLElement, 'closest'>;

  assert.equal(module.shouldIgnoreTaskTableRowClick(dropdownTarget), true);
});

test('task table row click ignores explicit row-click opt-out markers', async () => {
  const module = await import('./EditableTaskTableRow');

  const ignoredTarget = {
    closest: (selector: string) => selector.includes('[data-row-click-ignore="true"]') ? {} : null,
  } as Pick<HTMLElement, 'closest'>;

  assert.equal(module.shouldIgnoreTaskTableRowClick(ignoredTarget), true);
  assert.equal(module.shouldIgnoreTaskTableRowClick(null), false);
});