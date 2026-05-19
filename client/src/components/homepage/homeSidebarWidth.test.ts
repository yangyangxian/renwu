import test from 'node:test';
import assert from 'node:assert/strict';

test('home sidebar width uses a clamp-based responsive range', async () => {
  const module = await import('./homeSidebarWidth');

  assert.equal(typeof module.HOME_SIDEBAR_WIDTH, 'string');
  assert.match(module.HOME_SIDEBAR_WIDTH, /^clamp\(/);
  assert.match(module.HOME_SIDEBAR_WIDTH, /16rem/);
  assert.match(module.HOME_SIDEBAR_WIDTH, /18rem/);
});