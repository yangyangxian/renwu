export class LabelResDto {
  id: string = '';
  name: string = '';
  description?: string = '';
  color?: string = '';
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
}

export class LabelCreateReqDto {
  // Backwards-compatible server expects `labelName` in some places
  labelName!: string;
  description?: string = '';
  color?: string = '';
}

export class LabelUpdateReqDto {
  name?: string;
  description?: string;
  color?: string;
}
