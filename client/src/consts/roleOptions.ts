import { ProjectRole } from '@fullstack/common';

export const roleOptions = [
  {
    value: ProjectRole.MEMBER,
    label: 'Member',
    description: 'Can view and edit tasks.'
  },
  {
    value: ProjectRole.ADMIN,
    label: 'Admin',
    description: 'Can manage members and project settings.'
  },
  {
    value: ProjectRole.OWNER,
    label: 'Owner',
    description: 'Admin-level access to all resources.'
  }
];
