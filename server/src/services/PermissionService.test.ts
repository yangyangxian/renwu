import { describe, expect, it } from 'vitest';
import { PermissionAction, ProjectRole } from '@fullstack/common';
import { getActionsForRole } from './PermissionService';

describe('getActionsForRole', () => {
  it('gives project owners every permission even when role associations are incomplete', () => {
    expect(getActionsForRole(ProjectRole.OWNER, [PermissionAction.DELETE_PROJECT]))
      .toEqual(Object.values(PermissionAction));
  });

  it('preserves the configured permissions for non-owner roles', () => {
    expect(getActionsForRole(ProjectRole.ADMIN, [PermissionAction.UPDATE_PROJECT]))
      .toEqual([PermissionAction.UPDATE_PROJECT]);
  });
});