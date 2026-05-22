import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { baseURL } from './globalSetup';

async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookieHeader = res.headers.get('set-cookie');
  return setCookieHeader ? setCookieHeader.split(';')[0] : '';
}

async function getCurrentUser(cookie: string) {
  const res = await fetch(`${baseURL}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  return data.data as { id: string; name: string; email: string };
}

async function deleteProject(projectId: string | undefined, cookie: string) {
  if (!projectId) {
    return;
  }

  const res = await fetch(`${baseURL}/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });

  if (res.status !== 200 && res.status !== 404) {
    const data = await res.json().catch(() => null);
    throw new Error(`Failed to clean up project ${projectId}: ${res.status} ${JSON.stringify(data)}`);
  }
}

describe('Task numbering API', () => {
  let ownerCookie: string;
  let ownerUserId: string;
  let firstProjectId: string;
  let secondProjectId: string;
  let firstProjectSlug: string;
  let secondProjectSlug: string;

  afterAll(async () => {
    await deleteProject(secondProjectId, ownerCookie);
    await deleteProject(firstProjectId, ownerCookie);
  });

  beforeAll(async () => {
    ownerCookie = await loginAndGetCookie('135729229@163.com', '1yypoizmkm');
    ownerUserId = (await getCurrentUser(ownerCookie)).id;

    firstProjectSlug = `a${Math.random().toString(36).slice(2, 4)}`;
    secondProjectSlug = `b${Math.random().toString(36).slice(2, 4)}`;

    const createFirstProjectRes = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: `__test__ task numbering project a ${firstProjectSlug}`,
        slug: firstProjectSlug,
      }),
    });
    const createFirstProjectData = await createFirstProjectRes.json();
    expect(createFirstProjectRes.status).toBe(200);
    firstProjectId = createFirstProjectData.data.id;

    const createSecondProjectRes = await fetch(`${baseURL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        name: `__test__ task numbering project b ${secondProjectSlug}`,
        slug: secondProjectSlug,
      }),
    });
    const createSecondProjectData = await createSecondProjectRes.json();
    expect(createSecondProjectRes.status).toBe(200);
    secondProjectId = createSecondProjectData.data.id;
  });

  it('assigns incrementing task numbers within a project and re-numbers when a task moves to a different project', async () => {
    const createFirstTaskRes = await fetch(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        title: 'First numbered task',
        assignedTo: ownerUserId,
        projectId: firstProjectId,
      }),
    });
    const createFirstTaskData = await createFirstTaskRes.json();
    expect(createFirstTaskRes.status).toBe(200);
    expect(createFirstTaskData.data.taskNumber).toBe(1);
    expect(createFirstTaskData.data.taskCode).toBe(`${firstProjectSlug}-1`);

    const createSecondTaskRes = await fetch(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        title: 'Second numbered task',
        assignedTo: ownerUserId,
        projectId: firstProjectId,
      }),
    });
    const createSecondTaskData = await createSecondTaskRes.json();
    expect(createSecondTaskRes.status).toBe(200);
    expect(createSecondTaskData.data.taskNumber).toBe(2);
    expect(createSecondTaskData.data.taskCode).toBe(`${firstProjectSlug}-2`);

    const moveTaskRes = await fetch(`${baseURL}/api/tasks/${createFirstTaskData.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        projectId: secondProjectId,
      }),
    });
    const moveTaskData = await moveTaskRes.json();
    expect(moveTaskRes.status).toBe(200);
    expect(moveTaskData.data.taskNumber).toBe(1);
    expect(moveTaskData.data.taskCode).toBe(`${secondProjectSlug}-1`);

    const createThirdTaskRes = await fetch(`${baseURL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        title: 'Third numbered task',
        assignedTo: ownerUserId,
        projectId: secondProjectId,
      }),
    });
    const createThirdTaskData = await createThirdTaskRes.json();
    expect(createThirdTaskRes.status).toBe(200);
    expect(createThirdTaskData.data.taskNumber).toBe(2);
    expect(createThirdTaskData.data.taskCode).toBe(`${secondProjectSlug}-2`);
  }, 15000);
});