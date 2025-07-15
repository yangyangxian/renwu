export class ProjectResDto {
  id: string = '';
  name: string = '';
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
  description?: string = '';
}
