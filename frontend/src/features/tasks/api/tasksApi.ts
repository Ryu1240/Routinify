import axios from '../../../config/axios';
import { Task, CreateTaskDto, UpdateTaskDto } from '../../../types';

type TaskResponse = {
  data: Task[];
};

type TaskRequestBody = {
  task: {
    title: string;
    due_date?: string | null;
    status?: string | null;
    priority?: string | null;
    category_id?: number | null;
  };
};

export const tasksApi = {
  fetchAll: async (): Promise<Task[]> => {
    const response = await axios.get<TaskResponse>('/api/v1/tasks');
    return response.data.data;
  },

  create: async (taskData: CreateTaskDto): Promise<void> => {
    const body: TaskRequestBody = {
      task: {
        title: taskData.title,
        due_date: taskData.dueDate,
        status: taskData.status,
        priority: taskData.priority,
        category_id: taskData.categoryId,
      },
    };
    await axios.post('/api/v1/tasks', body);
  },

  update: async (taskId: number, taskData: UpdateTaskDto): Promise<void> => {
    const body: TaskRequestBody = {
      task: {
        title: taskData.title || '',
        due_date: taskData.dueDate,
        status: taskData.status,
        priority: taskData.priority,
        category_id: taskData.categoryId,
      },
    };
    await axios.put(`/api/v1/tasks/${taskId}`, body);
  },

  delete: async (taskId: number): Promise<void> => {
    await axios.delete(`/api/v1/tasks/${taskId}`);
  },
};
