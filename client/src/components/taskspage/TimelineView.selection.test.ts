import test from 'node:test';
import assert from 'node:assert/strict';

test('timeline calendar only shows selected state inside the owning month card', async () => {
  const module = await import('./TimelineView');

  assert.equal(module.shouldShowTimelineSelectedDay({ selected: true, outside: false }), true);
  assert.equal(module.shouldShowTimelineSelectedDay({ selected: true, outside: true }), false);
  assert.equal(module.shouldShowTimelineSelectedDay({ selected: false, outside: true }), false);
});

test('timeline calendar only renders when there are timeline groups', async () => {
  const module = await import('./TimelineView');

  assert.equal(module.shouldRenderTimelineCalendar(0), false);
  assert.equal(module.shouldRenderTimelineCalendar(1), true);
});