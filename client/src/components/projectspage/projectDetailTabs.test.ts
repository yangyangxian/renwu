import test from 'node:test';
import assert from 'node:assert/strict';

test('project detail tabs default to tasks and include wiki instead of overview', async () => {
  const module = await import('./projectDetailTabs');

  assert.equal(module.PROJECT_DEFAULT_TAB, 'tasks');
  assert.deepEqual(
    module.PROJECT_DETAIL_TABS.map((tab: { value: string; label: string }) => ({
      value: tab.value,
      label: tab.label,
    })),
    [
      { value: 'tasks', label: 'Tasks' },
      { value: 'wiki', label: 'Wiki' },
      { value: 'team', label: 'Team' },
      { value: 'labels', label: 'Labels' },
      { value: 'settings', label: 'Settings' },
    ]
  );
});

test('legacy overview hashes normalize to wiki', async () => {
  const module = await import('./projectDetailTabs');

  assert.equal(module.normalizeProjectDetailTab('overview'), 'wiki');
  assert.equal(module.normalizeProjectDetailTab('tasks'), 'tasks');
});