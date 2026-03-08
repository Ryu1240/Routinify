import axios from '@/lib/axios';
import { Task, CreateTaskDto, UpdateTaskDto } from '@/types';

type TaskResponse = {
  data: Task[];
};

type TaskRequestBody = {
  task: {
    title?: string;
    due_date?: string | null;
    status?: string | null;
    priority?: string | null;
    category_id?: number | null;
  };
};

type FetchAllParams = {
  statuses?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  overdue?: boolean;
  due_today?: boolean;
  q?: string;
  include_completed?: boolean;
};

export const tasksApi = {
  fetchAll: async (
    params?: FetchAllParams,
    skipCache = false
  ): Promise<Task[]> => {
    const requestParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.statuses) requestParams.statuses = params.statuses;
      if (params.sort_by) requestParams.sort_by = params.sort_by;
      if (params.sort_order) requestParams.sort_order = params.sort_order;
      if (params.status) requestParams.status = params.status;
      if (params.overdue) requestParams.overdue = params.overdue.toString();
      if (params.due_today)
        requestParams.due_today = params.due_today.toString();
      if (params.q) requestParams.q = params.q;
      if (params.include_completed !== undefined)
        requestParams.include_completed = params.include_completed;
    }

    const config = skipCache
      ? {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          params: {
            ...requestParams,
            _t: Date.now(), // キャッシュ回避のためのタイムスタンプ
          },
        }
      : {
          params: requestParams,
        };
    const response = await axios.get<TaskResponse>('/api/v1/tasks', config);
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
        ...(taskData.title !== undefined && { title: taskData.title }),
        ...(taskData.dueDate !== undefined && { due_date: taskData.dueDate }),
        ...(taskData.status !== undefined && { status: taskData.status }),
        ...(taskData.priority !== undefined && { priority: taskData.priority }),
        ...(taskData.categoryId !== undefined && {
          category_id: taskData.categoryId,
        }),
      },
    };
    await axios.put(`/api/v1/tasks/${taskId}`, body);
  },

  delete: async (taskId: number): Promise<void> => {
    await axios.delete(`/api/v1/tasks/${taskId}`);
  },
};
