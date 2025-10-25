import axios from '@/lib/axios';
import {
  RoutineTask,
  CreateRoutineTaskDto,
  UpdateRoutineTaskDto,
} from '@/types';

type RoutineTaskResponse = {
  data: RoutineTask[];
};

type SingleRoutineTaskResponse = {
  data: RoutineTask;
};

type RoutineTaskRequestBody = {
  routine_task: {
    title: string;
    frequency: string;
    interval_value?: number | null;
    next_generation_at: string;
    max_active_tasks: number;
    category_id?: number | null;
    priority?: string | null;
    is_active: boolean;
  };
};

export const routineTasksApi = {
  fetchAll: async (): Promise<RoutineTask[]> => {
    const response = await axios.get<RoutineTaskResponse>(
      '/api/v1/routine_tasks'
    );
    return response.data.data;
  },

  fetchById: async (id: number): Promise<RoutineTask> => {
    const response = await axios.get<SingleRoutineTaskResponse>(
      `/api/v1/routine_tasks/${id}`
    );
    return response.data.data;
  },

  create: async (
    routineTaskData: CreateRoutineTaskDto
  ): Promise<RoutineTask> => {
    const body: RoutineTaskRequestBody = {
      routine_task: {
        title: routineTaskData.title,
        frequency: routineTaskData.frequency,
        interval_value: routineTaskData.intervalValue,
        next_generation_at: routineTaskData.nextGenerationAt,
        max_active_tasks: routineTaskData.maxActiveTasks,
        category_id: routineTaskData.categoryId,
        priority: routineTaskData.priority,
        is_active: routineTaskData.isActive,
      },
    };
    const response = await axios.post<SingleRoutineTaskResponse>(
      '/api/v1/routine_tasks',
      body
    );
    return response.data.data;
  },

  update: async (
    id: number,
    routineTaskData: UpdateRoutineTaskDto
  ): Promise<RoutineTask> => {
    const body: Partial<RoutineTaskRequestBody> = {
      routine_task: {
        ...(routineTaskData.title && { title: routineTaskData.title }),
        ...(routineTaskData.frequency && {
          frequency: routineTaskData.frequency,
        }),
        ...(routineTaskData.intervalValue !== undefined && {
          interval_value: routineTaskData.intervalValue,
        }),
        ...(routineTaskData.nextGenerationAt && {
          next_generation_at: routineTaskData.nextGenerationAt,
        }),
        ...(routineTaskData.maxActiveTasks !== undefined && {
          max_active_tasks: routineTaskData.maxActiveTasks,
        }),
        ...(routineTaskData.categoryId !== undefined && {
          category_id: routineTaskData.categoryId,
        }),
        ...(routineTaskData.priority !== undefined && {
          priority: routineTaskData.priority,
        }),
        ...(routineTaskData.isActive !== undefined && {
          is_active: routineTaskData.isActive,
        }),
      },
    };
    const response = await axios.put<SingleRoutineTaskResponse>(
      `/api/v1/routine_tasks/${id}`,
      body
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/routine_tasks/${id}`);
  },
};
