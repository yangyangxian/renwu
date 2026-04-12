import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDefaultTaskTableColumnWidths,
  getTaskTableGridTemplateColumns,
  getTaskTableColumnWidthStorageKey,
  getTaskTableTitleAutoWidthStorageKey,
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
    actions: 104,
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
    title: 1200,
  });

  assert.deepEqual(resizeTaskTableColumn(base, 'status', 80), {
    ...base,
    status: 130,
  });

  assert.deepEqual(resizeTaskTableColumn(base, 'actions', 40), {
    ...base,
    actions: 96,
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
      actions: 104,
    }
  );
});

test('sanitizeTaskTableColumnWidths preserves manually expanded title widths', () => {
  assert.deepEqual(
    sanitizeTaskTableColumnWidths({
      title: 1200,
      assignee: 170,
      status: 170,
      updatedAt: 190,
      actions: 104,
    }),
    {
      title: 1200,
      assignee: 170,
      status: 170,
      updatedAt: 190,
      actions: 104,
    }
  );
});

test('getTaskTableGridTemplateColumns keeps default title sizing elastic up to the maximum width', () => {
  assert.equal(
    getTaskTableGridTemplateColumns({
      title: 560,
      assignee: 170,
      status: 170,
      updatedAt: 190,
      actions: 104,
    }, { titleAutoWidth: true }),
    '170px minmax(560px, 700px) 170px 190px 104px'
  );
});

test('getTaskTableGridTemplateColumns fixes manually resized title widths without applying the auto cap', () => {
  assert.equal(
    getTaskTableGridTemplateColumns({
      title: 1200,
      assignee: 170,
      status: 170,
      updatedAt: 190,
      actions: 104,
    }, { titleAutoWidth: false }),
    '170px 1200px 170px 190px 104px'
  );
});

test('getTaskTableGridTemplateColumns makes title absorb remaining space while other columns stay fixed', () => {
  assert.equal(
    getTaskTableGridTemplateColumns(getDefaultTaskTableColumnWidths(), { titleAutoWidth: true }),
    '170px minmax(560px, 700px) 170px 190px 104px'
  );
});

test('getTaskTableMinWidth returns the minimum scroll width for the table content', () => {
  assert.equal(
    getTaskTableMinWidth(getDefaultTaskTableColumnWidths()),
    1194
  );
});

test('getTaskTableColumnWidthStorageKey scopes widths by page context', () => {
  assert.equal(getTaskTableColumnWidthStorageKey('my-tasks'), 'task-table-widths:my-tasks');
  assert.equal(getTaskTableColumnWidthStorageKey('project:abc123'), 'task-table-widths:project:abc123');
});

test('getTaskTableTitleAutoWidthStorageKey scopes title auto mode by page context', () => {
  assert.equal(getTaskTableTitleAutoWidthStorageKey('my-tasks'), 'task-table-title-auto:my-tasks');
  assert.equal(getTaskTableTitleAutoWidthStorageKey('project:abc123'), 'task-table-title-auto:project:abc123');
});