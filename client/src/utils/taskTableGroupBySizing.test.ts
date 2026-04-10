import test from 'node:test';
import assert from 'node:assert/strict';

import { getTaskTableGroupByTriggerWidth } from './taskTableGroupBySizing';

test('getTaskTableGroupByTriggerWidth uses the longest label set name with a minimum width', () => {
  assert.equal(
    getTaskTableGroupByTriggerWidth(['Sprint', 'Release version']),
    '20ch'
  );
});

test('getTaskTableGroupByTriggerWidth clamps very long option labels to a reasonable max width', () => {
  assert.equal(
    getTaskTableGroupByTriggerWidth(['A very long label set name that should not keep growing forever']),
    '28ch'
  );
});

test('getTaskTableGroupByTriggerWidth falls back to the minimum width without label sets', () => {
  assert.equal(
    getTaskTableGroupByTriggerWidth([]),
    '16ch'
  );
});