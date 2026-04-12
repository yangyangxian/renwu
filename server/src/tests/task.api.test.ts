import { describe, it, beforeAll, expect } from 'vitest';
import { baseURL } from './globalSetup';
import {
  ErrorCodes,
  ProjectRole,
  TaskDateRange,
  TaskSortField,
  TaskSortOrder,
  TaskStatus,
  TaskViewCreateReqDto,
  TaskViewMode,
  TaskViewUpdateReqDto,
} from '@fullstack/common';

async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookieHeader = res.headers.get('set-cookie');
  return setCookieHeader ? setCookieHeader.split(';')[0] : '';
}

describe('Task View API', () => {
  let userCookie: string;
  let createdViewId: string;

  beforeAll(async () => {
    userCookie = await loginAndGetCookie('alice@demo.com', '1yypoizmkm');
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

describe('Project Task View API', () => {
  let ownerCookie: string;
  let memberCookie: string;
  let memberRoleId: string;
  let projectId: string;
  let createdViewId: string;
  const projectSlug = `p${Math.random().toString(36).slice(2, 4)}`;

  beforeAll(async () => {
    ownerCookie = await loginAndGetCookie('135729229@163.com', '1yypoizmkm');
    memberCookie = await loginAndGetCookie('alice@demo.com', '1yypoizmkm');

    const rolesRes = await fetch(`${baseURL}/api/auth/roles`, {
      headers: { Cookie: ownerCookie },
    });
    const rolesData = await rolesRes.json();
    const memberRole = rolesData.data.find((role: { name: string; id: string }) => role.name === ProjectRole.MEMBER);
    expect(memberRole).toBeTruthy();
    memberRoleId = memberRole.id;

    const createProjectRes = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: 'Project Task View Test',
        description: 'Project scoped task view test project',
        slug: projectSlug,
      }),
    });
    const createProjectData = await createProjectRes.json();
    expect(createProjectRes.status).toBe(200);
    projectId = createProjectData.data.id;

    const addMemberRes = await fetch(`${baseURL}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        email: 'alice@demo.com',
        roleId: memberRoleId,
      }),
    });
    const addMemberData = await addMemberRes.json();
    expect(addMemberRes.status).toBe(200);
    expect(addMemberData.data.success).toBe(true);
  });

  it('should create a project-scoped task view', async () => {
    const body: TaskViewCreateReqDto = {
      name: 'Project Shared View',
      projectId,
      viewConfig: {
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        projectId,
        viewMode: TaskViewMode.TABLE,
        searchTerm: 'project-view',
        dateRange: TaskDateRange.ALL_TIME,
        sortField: TaskSortField.DUE_DATE,
        sortOrder: TaskSortOrder.ASC,
        groupByLabelSetId: null,
      },
    };
    const res = await fetch(`${baseURL}/api/tasks/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.projectId).toBe(projectId);
    createdViewId = data.data.id;
  });

  it('should include project-scoped task views for project members', async () => {
    const res = await fetch(`${baseURL}/api/tasks/views`, {
      headers: { Cookie: memberCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.some((view: { id: string; projectId: string | null }) => view.id === createdViewId && view.projectId === projectId)).toBe(true);
  });

  it('should prevent non-creators from updating a project-scoped task view', async () => {
    const body: TaskViewUpdateReqDto = {
      name: 'Member Updated View',
      projectId,
      viewConfig: {
        status: [TaskStatus.IN_PROGRESS],
        projectId,
        viewMode: TaskViewMode.LIST,
        dateRange: TaskDateRange.LAST_3_MONTHS,
        sortField: TaskSortField.DUE_DATE,
        sortOrder: TaskSortOrder.ASC,
        searchTerm: 'member-update',
        groupByLabelSetId: null,
      },
    };
    const res = await fetch(`${baseURL}/api/tasks/views/${createdViewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: memberCookie,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it('should prevent non-creators from deleting a project-scoped task view', async () => {
    const res = await fetch(`${baseURL}/api/tasks/views/${createdViewId}`, {
      method: 'DELETE',
      headers: { Cookie: memberCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it('should allow the creator to delete the project-scoped task view', async () => {
    const res = await fetch(`${baseURL}/api/tasks/views/${createdViewId}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data).toBeNull();
  });

  it('should delete the test project', async () => {
    const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});
