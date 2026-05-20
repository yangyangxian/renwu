import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskDateRange, TaskViewMode } from '@fullstack/common';

type TestWindow = {
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};

test('project task tab memory persists only the tab-owned controls under a project-specific key', async () => {
  const module = await import('./projectTaskTabMemory');

  assert.equal(module.getProjectTaskTabMemoryStorageKey('project-1'), 'project-task-tab-memory:project-1');
  assert.deepEqual(
    module.toProjectTaskTabMemory({
      projectId: 'project-1',
      dateRange: TaskDateRange.LAST_3_MONTHS,
      searchTerm: 'alpha',
      filterLabelId: 'label-1',
      filterLabelSetId: 'label-set-1',
      viewMode: TaskViewMode.TABLE,
    }),
    {
      dateRange: TaskDateRange.LAST_3_MONTHS,
      searchTerm: 'alpha',
      filterLabelId: 'label-1',
      filterLabelSetId: 'label-set-1',
      viewMode: TaskViewMode.TABLE,
    }
  );
});

test('project task tab memory round-trips through localStorage per project', async (t) => {
  const module = await import('./projectTaskTabMemory');
  const storage = new Map<string, string>();
  const scopedGlobal = globalThis as typeof globalThis & { window?: TestWindow };
  const previousWindow = scopedGlobal.window;

  scopedGlobal.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    },
  };

  t.after(() => {
    if (previousWindow) {
      scopedGlobal.window = previousWindow;
      return;
    }

    delete scopedGlobal.window;
  });

  module.writeProjectTaskTabMemory('project-1', {
    searchTerm: 'beta',
    viewMode: TaskViewMode.LIST,
  });

  assert.deepEqual(module.readProjectTaskTabMemory('project-1'), {
    dateRange: TaskDateRange.ALL_TIME,
    searchTerm: 'beta',
    filterLabelId: null,
    filterLabelSetId: null,
    viewMode: TaskViewMode.LIST,
  });
  assert.equal(module.readProjectTaskTabMemory('project-2'), null);
});