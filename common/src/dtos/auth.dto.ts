import { z } from 'zod';

// Zod schema for validation
export const LoginReqSchema = z.object({
  email: z.email({message : 'Not a valid email address.'}).max(100, { message: 'Email must be at most 100 characters long' }),
  password: z.string().min(6, { message: 'Password must be between 6 and 20 characters long' }).max(20, { message: 'Password must be between 6 and 20 characters long' }),
});

// DTO class for instantiation and mapping
export class LoginReqDto {
  email: string = '';
  password: string = '';
}

// DTO class for instantiation and mapping
export class LogoutResDto {
  message: string = '';
}

// DTO for login response (user + token)
export class LoginResDto {
  id: string = '';
  name: string = '';
  email: string = '';
  token: string = '';
  constructor(data?: Partial<LoginResDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

