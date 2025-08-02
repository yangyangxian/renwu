import { describe, it, beforeAll, expect } from 'vitest';
import { baseURL } from './globalSetup';
import { ErrorCodes, ProjectRole } from '@fullstack/common';

describe('Projects API', () => {
  let ownerCookie: string;
  let projectId: string;
  let adminCookie: string;
  let memberCookie: string;
  let memberRoleId: string;
  let adminRoleId: string;

  beforeAll(async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '135729229@163.com', password: '1yypoizmkm' })
    });
    const setCookieHeader = res.headers.get('set-cookie');
    ownerCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';

    const res2 = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '284712074@qq.com', password: '1yypoizmkm' })
    });
    const setCookieHeader2 = res2.headers.get('set-cookie');
    adminCookie = setCookieHeader2 ? setCookieHeader2.split(';')[0] : '';

    const res3 = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@demo.com', password: '1yypoizmkm' })
    });
    const setCookieHeader3 = res3.headers.get('set-cookie');
    memberCookie = setCookieHeader3 ? setCookieHeader3.split(';')[0] : '';

    // Fetch all roles and store the MEMBER and ADMIN roleIds
    const rolesRes = await fetch(`${baseURL}/api/auth/roles`, {
      headers: { 'Cookie': ownerCookie }
    });
    const rolesData = await rolesRes.json();
    const memberRole = rolesData.data.find((r: any) => r.name === ProjectRole.MEMBER);
    expect(memberRole).toBeTruthy();
    memberRoleId = memberRole.id;
    const adminRole = rolesData.data.find((r: any) => r.name === ProjectRole.ADMIN);
    expect(adminRole).toBeTruthy();
    adminRoleId = adminRole.id;
  });

  it('should create a new project', async () => {
    const res = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': ownerCookie
      },
      body: JSON.stringify({ name: 'Test Project', description: 'Test Desc', slug: 'te' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.name).toBe('Test Project');
    projectId = data.data.id;
  });

  it('should fetch the created project', async () => {
    const res = await fetch(`${baseURL}/api/projects/id/${projectId}`, {
      headers: { 'Cookie': ownerCookie }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.id).toBe(projectId);
  });

  it('should add a admin member to the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ownerCookie
      },
      body: JSON.stringify({ email: '284712074@qq.com', roleId: adminRoleId })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.success).toBe(true);
  });

  it('should add a member to the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ email: 'alice@demo.com', roleId: memberRoleId })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.success).toBe(true);
  });

  it('should update the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ name: 'Updated Project', description: 'Updated Desc', slug: 'upd' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.name).toBe('Updated Project');
  });

  it('should not have the permission to update the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': memberCookie 
      },
      body: JSON.stringify({ name: 'Updated Project', description: 'Updated Desc', slug: 'upd' })
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('should not have the permission to delete the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': memberCookie
      }
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('should delete the project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': ownerCookie
      }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});
