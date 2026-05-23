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
    taskCode: 120,
    title: 560,
    status: 170,
    assignee: 170,
    actions: 116,
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
      taskCode: 80,
      title: 480,
      assignee: 'bad',
      status: 999,
      ignored: 100,
    }),
    {
      taskCode: 96,
      title: 480,
      status: 220,
      assignee: 170,
      actions: 116,
    }
  );
});

test('sanitizeTaskTableColumnWidths preserves manually expanded title widths', () => {
  assert.deepEqual(
    sanitizeTaskTableColumnWidths({
      taskCode: 120,
      title: 1200,
      status: 170,
      assignee: 170,
      actions: 116,
    }),
    {
      taskCode: 120,
      title: 1200,
      status: 170,
      assignee: 170,
      actions: 116,
    }
  );
});

test('getTaskTableGridTemplateColumns keeps default title sizing elastic up to the maximum width', () => {
  assert.equal(
    getTaskTableGridTemplateColumns({
      taskCode: 120,
      title: 560,
      status: 170,
      assignee: 170,
      actions: 116,
    }, { titleAutoWidth: true }),
    '120px minmax(560px, 700px) 170px 170px 116px'
  );
});

test('getTaskTableGridTemplateColumns fixes manually resized title widths without applying the auto cap', () => {
  assert.equal(
    getTaskTableGridTemplateColumns({
      taskCode: 120,
      title: 1200,
      status: 170,
      assignee: 170,
      actions: 116,
    }, { titleAutoWidth: false }),
    '120px 1200px 170px 170px 116px'
  );
});

test('getTaskTableGridTemplateColumns makes title absorb remaining space while other columns stay fixed', () => {
  assert.equal(
    getTaskTableGridTemplateColumns(getDefaultTaskTableColumnWidths(), { titleAutoWidth: true }),
    '120px minmax(560px, 700px) 170px 170px 116px'
  );
});

test('getTaskTableMinWidth returns the minimum scroll width for the table content', () => {
  assert.equal(
    getTaskTableMinWidth(getDefaultTaskTableColumnWidths()),
    1136
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