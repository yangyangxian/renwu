import { z } from 'zod';
export const ProjectAddMemberReqSchema = z.object({
  email: z.email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

export class ProjectAddMemberReqDto {
  email: string = '';
  roleId: string = '';
}

export class ProjectAddMemberResDto {
  success!: boolean;
  invited?: boolean;
  error?: string;
}

export class ProjectUpdateReqDto {
  name?: string;
  description?: string;
  slug?: string;
}
export class ProjectMemberRoleUpdateReqDto {
  roleId: string = '';
  roleName?: string = '';
}

export const ProjectCreateReqSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  slug: z.string().min(2, 'Project ID must be at least 2 characters').max(3, 'Project ID must be at most 3 characters'),
  description: z.string().optional(),
});
export class ProjectResDto {
  id: string = '';
  name: string = '';
  slug: string = '';
  description?: string = '';
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
  members?: ProjectMemberResDto[] = [];
}

export class ProjectMemberResDto {
  id: string = '';
  name: string = '';
  email?: string = '';
  roleId: string = '';
  roleName?: string = '';
}

export class ProjectCreateReqDto {
  name: string = '';
  slug: string = '';
  description?: string = '';
}
