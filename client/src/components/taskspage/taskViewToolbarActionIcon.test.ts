import test from 'node:test';
import assert from 'node:assert/strict';

import { Bookmark, BookmarkPlus } from 'lucide-react';

import { getTaskViewToolbarActionIcon } from './taskViewToolbarActionIcon';

test('getTaskViewToolbarActionIcon uses a create-style icon when no saved view is selected', () => {
  assert.equal(getTaskViewToolbarActionIcon(false), BookmarkPlus);
});

test('getTaskViewToolbarActionIcon keeps the bookmark icon for saved-view actions', () => {
  assert.equal(getTaskViewToolbarActionIcon(true), Bookmark);
});