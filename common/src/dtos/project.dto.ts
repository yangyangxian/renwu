import { z } from 'zod';

export class ProjectAddMemberReqDto {
  email: string = '';
  role: string = '';
}

export class ProjectUpdateReqDto {
  name?: string;
  description?: string;
  slug?: string;
}
export class ProjectMemberRoleUpdateReqDto {
  role: string = '';
}

export const ProjectCreateReqSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(3, 'Slug must be at most 3 characters'),
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
  role: string = '';
}

export class ProjectCreateReqDto {
  name: string = '';
  slug: string = '';
  description?: string = '';
}
