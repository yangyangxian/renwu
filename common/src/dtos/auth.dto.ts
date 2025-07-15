import { z } from 'zod';

// Zod schema for validation
export const LoginReqSchema = z.object({
  email: z.email({message : 'Not a valid email address.'}).max(100, { message: 'Email must be at most 100 characters long' }),
  password: z.string().min(6).max(20, { message: 'Password must be between 6 and 20 characters long' }),
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
