import { describe, expect, it } from 'vitest';

import { getDialogContentClassName, getDialogViewportClassName } from './Dialog';

describe('Dialog layout', () => {
  it('centers content without translate-based positioning that can blur text', () => {
    expect(getDialogViewportClassName()).toContain('place-items-center');

    const contentClassName = getDialogContentClassName();

    expect(contentClassName).not.toContain('fixed top-[50%] left-[50%]');
    expect(contentClassName).not.toContain('translate-x-[-50%]');
    expect(contentClassName).not.toContain('translate-y-[-50%]');
  });
});