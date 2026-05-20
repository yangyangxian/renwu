import test from 'node:test';
import assert from 'node:assert/strict';

test('project detail layout uses a narrower wiki panel and a slightly reduced team left column', async () => {
  const module = await import('./projectDetailLayout');

  assert.equal(typeof module.PROJECT_WIKI_PANEL_CLASS, 'string');
  assert.match(module.PROJECT_WIKI_PANEL_CLASS, /\bw-3\/4\b/);

  assert.equal(typeof module.PROJECT_TEAM_LAYOUT_CLASS, 'string');
  assert.match(module.PROJECT_TEAM_LAYOUT_CLASS, /1\.5fr/);

  assert.equal(typeof module.PROJECT_TEAM_PRIMARY_COLUMN_CLASS, 'string');
  assert.doesNotMatch(module.PROJECT_TEAM_PRIMARY_COLUMN_CLASS, /max-w-/);
});