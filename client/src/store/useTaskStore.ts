import { create } from 'zustand';
import { TaskResDto } from '@fullstack/common';

interface TaskStoreState {
  tasks: TaskResDto[];
  setTasks: (tasks: TaskResDto[]) => void;
  addTask: (task: TaskResDto) => void;
  updateTask: (task: TaskResDto) => void;
  removeTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map(t => t.id === task.id ? task : t)
  })),
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),
}));
