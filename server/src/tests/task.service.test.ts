import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
}));

vi.mock('../database/databaseAccess', () => ({
  db: {
    select: selectMock,
  },
}));

import { taskService } from '../services/TaskService';

type QueryResolutionPoint = 'where' | 'orderBy';

function createSelectBuilder<T>(rows: T[], resolveAt: QueryResolutionPoint = 'where') {
  const builder: Record<string, any> = {
    from: vi.fn(() => builder),
    leftJoin: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(() => resolveAt === 'where' ? Promise.resolve(rows) : builder),
    orderBy: vi.fn(() => Promise.resolve(rows)),
  };

  return builder;
}

describe('TaskService.getTasksByProjectId', () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it('hydrates all task labels with one batched label query', async () => {
    const mainRows = [
      {
        id: 'task-1',
        assignedToId: 'user-1',
        assignedToName: 'Alice',
        assignedToEmail: 'alice@example.com',
        assignedToCreatedAt: new Date('2026-03-10T00:00:00.000Z'),
        createdById: 'user-2',
        createdByName: 'Bob',
        createdByEmail: 'bob@example.com',
        createdByCreatedAt: new Date('2026-03-09T00:00:00.000Z'),
        title: 'Task One',
        description: 'First task',
        status: 'todo',
        projectId: 'project-1',
        dueDate: null,
        createdAt: new Date('2026-03-11T00:00:00.000Z'),
        updatedAt: new Date('2026-03-11T01:00:00.000Z'),
        projectName: 'Renwu',
      },
      {
        id: 'task-2',
        assignedToId: 'user-1',
        assignedToName: 'Alice',
        assignedToEmail: 'alice@example.com',
        assignedToCreatedAt: new Date('2026-03-10T00:00:00.000Z'),
        createdById: 'user-2',
        createdByName: 'Bob',
        createdByEmail: 'bob@example.com',
        createdByCreatedAt: new Date('2026-03-09T00:00:00.000Z'),
        title: 'Task Two',
        description: 'Second task',
        status: 'in_progress',
        projectId: 'project-1',
        dueDate: null,
        createdAt: new Date('2026-03-11T02:00:00.000Z'),
        updatedAt: new Date('2026-03-11T03:00:00.000Z'),
        projectName: 'Renwu',
      },
    ];

    const labelRows = [
      {
        taskId: 'task-1',
        id: 'label-1',
        labelName: 'backend',
        labelColor: '#111111',
      },
      {
        taskId: 'task-1',
        id: 'label-2',
        labelName: 'urgent',
        labelColor: '#222222',
      },
    ];

    selectMock
      .mockImplementationOnce(() => createSelectBuilder(mainRows, 'where'))
      .mockImplementationOnce(() => createSelectBuilder(labelRows, 'orderBy'));

    const result = await taskService.getTasksByProjectId('project-1');

    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].labels).toHaveLength(2);
    expect(result[0].labels?.map(label => label.labelName)).toEqual(['backend', 'urgent']);
    expect(result[1].labels).toEqual([]);
  });

  it('returns early when the project has no tasks', async () => {
    selectMock.mockImplementationOnce(() => createSelectBuilder([], 'where'));

    const result = await taskService.getTasksByProjectId('project-1');

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});

describe('TaskService.getTasksByUserId', () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it('hydrates user task labels with one batched label query', async () => {
    const mainRows = [
      {
        id: 'task-1',
        assignedToId: 'user-1',
        assignedToName: 'Alice',
        assignedToEmail: 'alice@example.com',
        assignedToCreatedAt: new Date('2026-03-10T00:00:00.000Z'),
        createdById: 'user-2',
        createdByName: 'Bob',
        createdByEmail: 'bob@example.com',
        createdByCreatedAt: new Date('2026-03-09T00:00:00.000Z'),
        title: 'Assigned Task One',
        description: 'First assigned task',
        status: 'todo',
        projectId: 'project-1',
        dueDate: null,
        createdAt: new Date('2026-03-11T00:00:00.000Z'),
        updatedAt: new Date('2026-03-11T01:00:00.000Z'),
        projectName: 'Renwu',
      },
      {
        id: 'task-2',
        assignedToId: 'user-1',
        assignedToName: 'Alice',
        assignedToEmail: 'alice@example.com',
        assignedToCreatedAt: new Date('2026-03-10T00:00:00.000Z'),
        createdById: 'user-2',
        createdByName: 'Bob',
        createdByEmail: 'bob@example.com',
        createdByCreatedAt: new Date('2026-03-09T00:00:00.000Z'),
        title: 'Assigned Task Two',
        description: 'Second assigned task',
        status: 'in_progress',
        projectId: 'project-1',
        dueDate: null,
        createdAt: new Date('2026-03-11T02:00:00.000Z'),
        updatedAt: new Date('2026-03-11T03:00:00.000Z'),
        projectName: 'Renwu',
      },
    ];

    const labelRows = [
      {
        taskId: 'task-1',
        id: 'label-1',
        labelName: 'backend',
        labelColor: '#111111',
      },
      {
        taskId: 'task-2',
        id: 'label-2',
        labelName: 'personal',
        labelColor: '#222222',
      },
    ];

    selectMock
      .mockImplementationOnce(() => createSelectBuilder(mainRows, 'where'))
      .mockImplementationOnce(() => createSelectBuilder(labelRows, 'orderBy'));

    const result = await taskService.getTasksByUserId('user-1');

    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].labels?.map(label => label.labelName)).toEqual(['backend']);
    expect(result[1].labels?.map(label => label.labelName)).toEqual(['personal']);
  });

  it('returns early when the user has no tasks', async () => {
    selectMock.mockImplementationOnce(() => createSelectBuilder([], 'where'));

    const result = await taskService.getTasksByUserId('user-1');

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});