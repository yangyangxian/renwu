import logger from "@/utils/logger";
import { TaskStatus, UserResDto } from "@fullstack/common";

export type TaskFormState = {
  id?: string;
  title: string;
  dueDate: string;
  assignedTo: string;
  status: TaskStatus;
  description: string;
  projectId?: string;
};

export type TaskFormAction =
  | { type: 'SET_FIELD'; field: keyof TaskFormState; value: any }
  | { type: 'RESET'; payload: Partial<TaskFormState> };

export const initialTaskFormState: TaskFormState = {
  id: '',
  title: '',
  dueDate: '',
  assignedTo: '',
  status: TaskStatus.TODO,
  description: '',
  projectId: '',
};

export function taskFormReducer(state: TaskFormState, action: TaskFormAction): TaskFormState {
  logger.info(`TaskFormReducer called with action: ${JSON.stringify(action)}`);
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialTaskFormState, ...action.payload };
    default:
      return state;
  }
}
