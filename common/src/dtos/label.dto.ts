export class LabelResDto {
  id: string = '';
  name: string = '';
  description?: string = '';
  color?: string = '';
  projectId?: string = '';
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
}

export class LabelCreateReqDto {
  // Backwards-compatible server expects `labelName` in some places
  labelName!: string;
  description?: string = '';
  color?: string = '';
  projectId?: string;
}

export class LabelUpdateReqDto {
  name?: string;
  description?: string;
  color?: string;
  projectId?: string | null;
}
