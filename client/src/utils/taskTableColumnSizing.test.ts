import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDefaultTaskTableColumnWidths,
  getTaskTableGridTemplateColumns,
  getTaskTableColumnWidthStorageKey,
  getTaskTableMinWidth,
  resizeTaskTableColumn,
  sanitizeTaskTableColumnWidths,
} from './taskTableColumnSizing';

test('getDefaultTaskTableColumnWidths returns the four editable table columns', () => {
  assert.deepEqual(getDefaultTaskTableColumnWidths(), {
    title: 560,
    assignee: 170,
    status: 170,
    updatedAt: 190,
    detail: 64,
  });
});

test('resizeTaskTableColumn clamps widths within each column bounds', () => {
  const base = getDefaultTaskTableColumnWidths();

  assert.deepEqual(resizeTaskTableColumn(base, 'title', 650), {
    ...base,
    title: 650,
  });

  assert.deepEqual(resizeTaskTableColumn(base, 'title', 1200), {
    ...base,
    title: 700,
  });

  assert.deepEqual(resizeTaskTableColumn(base, 'status', 80), {
    ...base,
    status: 130,
  });

  assert.deepEqual(resizeTaskTableColumn(base, 'detail', 40), {
    ...base,
    detail: 56,
  });
});

test('sanitizeTaskTableColumnWidths keeps known numeric widths and falls back to defaults for invalid entries', () => {
  assert.deepEqual(
    sanitizeTaskTableColumnWidths({
      title: 480,
      assignee: 'bad',
      status: 999,
      updatedAt: 150,
      ignored: 100,
    }),
    {
      title: 480,
      assignee: 170,
      status: 220,
      updatedAt: 160,
      detail: 64,
    }
  );
});

test('getTaskTableGridTemplateColumns makes title absorb remaining space while other columns stay fixed', () => {
  assert.equal(
    getTaskTableGridTemplateColumns(getDefaultTaskTableColumnWidths()),
    'minmax(560px, 700px) 170px 170px 190px 64px'
  );
});

test('getTaskTableMinWidth returns the minimum scroll width for the table content', () => {
  assert.equal(
    getTaskTableMinWidth(getDefaultTaskTableColumnWidths()),
    1154
  );
});

test('getTaskTableColumnWidthStorageKey scopes widths by page context', () => {
  assert.equal(getTaskTableColumnWidthStorageKey('my-tasks'), 'task-table-widths:my-tasks');
  assert.equal(getTaskTableColumnWidthStorageKey('project:abc123'), 'task-table-widths:project:abc123');
});