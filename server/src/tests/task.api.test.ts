import { describe, it, beforeAll, expect } from 'vitest';
import { baseURL } from './globalSetup';
import { TaskDateRange, TaskSortField, TaskSortOrder, TaskStatus, TaskViewCreateReqDto, TaskViewMode, TaskViewUpdateReqDto } from '@fullstack/common';

describe('Task View API', () => {
  let userCookie: string;
  let createdViewId: string;

  beforeAll(async () => {
    // Use a real test user (replace with your test user credentials)
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@demo.com', password: '1yypoizmkm' })
    });
    const setCookieHeader = res.headers.get('set-cookie');
    userCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
  });

  it('should create a new task view', async () => {
    const body: TaskViewCreateReqDto = {
      name: 'My View',
      viewConfig: {
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        projectId: 'add project id', viewMode: TaskViewMode.LIST, searchTerm: 'search term',
        dateRange: TaskDateRange.LAST_3_MONTHS,
        sortField: TaskSortField.DUE_DATE,
        sortOrder: TaskSortOrder.ASC
      },
    };
    const res = await fetch(`${baseURL}/api/tasks/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': userCookie,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe(body.name);
    createdViewId = data.data.id;
  });

  it('should get all task views for the user', async () => {
    const res = await fetch(`${baseURL}/api/tasks/views`, {
      headers: { 'Cookie': userCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.some((v: any) => v.id === createdViewId)).toBe(true);
  });

  it('should update a task view', async () => {
    const body: TaskViewUpdateReqDto = {
      name: 'Updated View',
      viewConfig: {
        status: [TaskStatus.IN_PROGRESS], projectId: 'updated',
        viewMode: TaskViewMode.LIST,
        dateRange: TaskDateRange.LAST_3_MONTHS,
        sortField: TaskSortField.DUE_DATE,
        sortOrder: TaskSortOrder.ASC,
        searchTerm: ''
      },
    };
    const res = await fetch(`${baseURL}/api/tasks/views/${createdViewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': userCookie,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.name).toBe(body.name);
  });

  it('should delete a task view', async () => {
    const res = await fetch(`${baseURL}/api/tasks/views/${createdViewId}`, {
      method: 'DELETE',
      headers: { 'Cookie': userCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeNull();
  });
});
