import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveTaskTableGroupBySelection } from './TaskTableGroupByControl';

const labelSets = [
  { id: 'label-set-1' },
  { id: 'label-set-2' },
];

test('resolveTaskTableGroupBySelection keeps the current valid selection', () => {
  assert.equal(
    resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: 'label-set-2',
      rememberedGroupByValue: 'label-set-1',
      labelSets,
    }),
    'label-set-2'
  );
});

test('resolveTaskTableGroupBySelection falls back to the remembered label set', () => {
  assert.equal(
    resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: null,
      rememberedGroupByValue: 'label-set-2',
      labelSets,
    }),
    'label-set-2'
  );
});

test('resolveTaskTableGroupBySelection defaults to the first label set on first entry', () => {
  assert.equal(
    resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: null,
      rememberedGroupByValue: null,
      labelSets,
    }),
    'label-set-1'
  );
});

test('resolveTaskTableGroupBySelection clears grouping when no label set exists', () => {
  assert.equal(
    resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: 'label-set-1',
      rememberedGroupByValue: 'label-set-2',
      labelSets: [],
    }),
    null
  );
});

test('resolveTaskTableGroupBySelection clears grouping in disabled scopes', () => {
  assert.equal(
    resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: 'label-set-1',
      rememberedGroupByValue: 'label-set-2',
      labelSets,
      isDisabled: true,
    }),
    null
  );
});