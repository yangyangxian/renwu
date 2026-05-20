import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOARD_TASK_CARD_TITLE_CLASS_NAME,
  DEFAULT_TASK_CARD_TITLE_CLASS_NAME,
  TASK_TABLE_SECTION_TITLE_ROW_CLASS_NAME,
} from './taskViewLayoutClasses';

test('board task card title uses a slightly larger text size than the compact default', () => {
  assert.match(BOARD_TASK_CARD_TITLE_CLASS_NAME, /\btext-sm\b/);
  assert.doesNotMatch(BOARD_TASK_CARD_TITLE_CLASS_NAME, /\btext-xs\b/);
  assert.match(DEFAULT_TASK_CARD_TITLE_CLASS_NAME, /\btext-xs\b/);
});

test('table view section titles are offset right to align with the table header and rows', () => {
  assert.match(TASK_TABLE_SECTION_TITLE_ROW_CLASS_NAME, /\bpl-9\b/);
  assert.doesNotMatch(TASK_TABLE_SECTION_TITLE_ROW_CLASS_NAME, /\bpx-1\b/);
});