export class UserResDto {
  id: string | undefined;
  name: string = '';
  email?: string = '';
}

export class UserReqDto {
  email: string;
  constructor(email: string) {
    this.email = email;
  }
}

export class UpdateUserReqDto {
  name: string = '';
}
