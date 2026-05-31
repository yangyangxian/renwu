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

test('timeline rail auto-scroll computes the selected day top inside the left rail container', async () => {
  const module = await import('./timelineScroll');

  assert.equal(
    module.getTimelineTargetScrollTop({
      containerScrollTop: 120,
      containerTop: 80,
      targetTop: 260,
    }),
    300
  );
});

test('timeline rail auto-scroll never returns a negative scroll target', async () => {
  const module = await import('./timelineScroll');

  assert.equal(
    module.getTimelineTargetScrollTop({
      containerScrollTop: 20,
      containerTop: 100,
      targetTop: 40,
    }),
    0
  );
});

test('timeline rail alignment helper treats near-top targets as aligned', async () => {
  const module = await import('./timelineScroll');

  assert.equal(
    module.isTimelineTargetAligned({
      containerTop: 100,
      targetTop: 106,
    }),
    true
  );

  assert.equal(
    module.isTimelineTargetAligned({
      containerTop: 100,
      targetTop: 120,
    }),
    false
  );
});