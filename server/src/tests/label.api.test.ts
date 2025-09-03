import { describe, it, beforeAll, expect } from 'vitest';
import { baseURL } from './globalSetup';

describe('Labels API', () => {
  let cookie: string = '';
  let createdSet: any = null;
  let createdLabel: any = null;

  beforeAll(async () => {
    const res = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '135729229@163.com', password: '1yypoizmkm' })
    });
    const setCookieHeader = res.headers.get('set-cookie');
    cookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
  });

  it('should create a label set', async () => {
    const res = await fetch(`${baseURL}/api/labels/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ labelSetName: 'Test Set', labelSetDescription: 'for tests' })
    });
    const data = await res.json();
    expect(res.status === 200 || res.status === 201).toBeTruthy();
    if (res.status === 200 || res.status === 201) {
      createdSet = data.data;
      expect(createdSet).toBeDefined();
      expect(createdSet.labelSetName).toBe('Test Set');
    }
  });

  it('should create a label inside the set', async () => {
    if (!createdSet) return;
    const res = await fetch(`${baseURL}/api/labels/sets/${createdSet.id}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ labelName: 'bug', labelDescription: 'a bug', labelColor: '#ff0000' })
    });
    const data = await res.json();
    expect(res.status === 200 || res.status === 201).toBeTruthy();
    if (res.status === 200 || res.status === 201) {
      createdLabel = data.data;
      expect(createdLabel).toBeDefined();
      expect(createdLabel.labelName).toBe('bug');
    }
  });

  it('should list label sets for current user', async () => {
    const res = await fetch(`${baseURL}/api/labels/sets/me`, {
      headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    expect(res.status === 200).toBeTruthy();
    if (res.status === 200) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  it('should list labels for current user', async () => {
    const res = await fetch(`${baseURL}/api/labels/me`, {
      headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    expect(res.status === 200).toBeTruthy();
    if (res.status === 200) {
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  it('should get, update, and delete a label', async () => {
    if (!createdLabel) return;
    const getRes = await fetch(`${baseURL}/api/labels/${createdLabel.id}`, { headers: { 'Cookie': cookie } });
    const getData = await getRes.json();
    expect(getRes.status === 200).toBeTruthy();

    const upRes = await fetch(`${baseURL}/api/labels/${createdLabel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ labelName: 'bug-updated' })
    });
    const upData = await upRes.json();
    expect(upRes.status === 200).toBeTruthy();

    const delRes = await fetch(`${baseURL}/api/labels/${createdLabel.id}`, { method: 'DELETE', headers: { 'Cookie': cookie } });
    expect(delRes.status === 200).toBeTruthy();
  });
});
