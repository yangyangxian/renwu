import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldIncludeTaskUpdateLabels } from './taskUpdatePayload';

test('shouldIncludeTaskUpdateLabels treats label order as unchanged but detects add/remove/clear changes', () => {
  assert.equal(shouldIncludeTaskUpdateLabels(['label-1', 'label-2'], ['label-2', 'label-1']), false);
  assert.equal(shouldIncludeTaskUpdateLabels(['label-1', 'label-2'], ['label-1']), true);
  assert.equal(shouldIncludeTaskUpdateLabels(['label-1'], []), true);
  assert.equal(shouldIncludeTaskUpdateLabels([], ['label-1']), true);
});