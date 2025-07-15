import { describe, it, expect } from 'vitest';
import { baseURL } from './globalSetup';
import { ErrorCodes } from '@fullstack/common';

describe('Auth API', () => {
  it('should login with valid credentials', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '135729229@163.com', password: '1yypoizmkm' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.email).toBe('135729229@163.com');
  });

  it('should fail login with invalid credentials', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com', password: 'wrongpassword' })
    });
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.data == null).toBe(true)
    expect(data.error).toBeDefined();
  });

  it('should fail login with invalid email format', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'validpass123' })
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.data == null).toBe(true);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(ErrorCodes.INVALID_INPUT);
  });

  it('should fail login with password too short', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: '1' })
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.data == null).toBe(true);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(ErrorCodes.INVALID_INPUT);
  });

  it('should fail login with password too long', async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'a'.repeat(101) })
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.data == null).toBe(true);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(ErrorCodes.INVALID_INPUT);
  });
});
