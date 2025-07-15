import { describe, it, beforeAll, expect } from 'vitest';
import { baseURL } from './globalSetup';

describe('Projects API', () => {
  let cookie: string;
  let projectId: string;

  beforeAll(async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '135729229@163.com', password: '1yypoizmkm' })
    });
    const setCookieHeader = res.headers.get('set-cookie');
    cookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
  });

  it('should create a new project', async () => {
    const res = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie 
      },
      body: JSON.stringify({ name: 'Test Project', description: 'Test Desc' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.name).toBe('Test Project');
    projectId = data.data.id;
  });

  it('should fetch the created project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.id).toBe(projectId);
  });

  it('should update the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie 
      },
      body: JSON.stringify({ name: 'Updated Project', description: 'Updated Desc' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.name).toBe('Updated Project');
  });

});
