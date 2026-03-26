import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveScopedFetchPolicy } from './scopedFetchPolicy';

test('resolveScopedFetchPolicy skips when the scope is already loaded', () => {
  assert.equal(
    resolveScopedFetchPolicy({
      hasLoadedScope: true,
      hasInFlightRequest: false,
      force: false,
    }),
    'skip'
  );
});

test('resolveScopedFetchPolicy joins an in-flight request for the same scope', () => {
  assert.equal(
    resolveScopedFetchPolicy({
      hasLoadedScope: false,
      hasInFlightRequest: true,
      force: false,
    }),
    'join'
  );
});

test('resolveScopedFetchPolicy fetches when the scope is not loaded and has no in-flight request', () => {
  assert.equal(
    resolveScopedFetchPolicy({
      hasLoadedScope: false,
      hasInFlightRequest: false,
      force: false,
    }),
    'fetch'
  );
});

test('resolveScopedFetchPolicy fetches when force is true even if the scope is loaded', () => {
  assert.equal(
    resolveScopedFetchPolicy({
      hasLoadedScope: true,
      hasInFlightRequest: true,
      force: true,
    }),
    'fetch'
  );
});