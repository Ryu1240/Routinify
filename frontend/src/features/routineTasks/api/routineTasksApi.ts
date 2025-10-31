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
    due_date_offset_days?: number | null;
    due_date_offset_hour?: number | null;
    start_generation_at: string;
  };
};

type UpdateRoutineTaskRequestBody = {
  routine_task: {
    title?: string;
    frequency?: string;
    interval_value?: number | null;
    next_generation_at?: string;
    max_active_tasks?: number;
    category_id?: number | null;
    priority?: string | null;
    is_active?: boolean;
    due_date_offset_days?: number | null;
    due_date_offset_hour?: number | null;
    start_generation_at: string;
  };
};

export type TaskGenerationJob = {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completed: boolean;
  generatedTasksCount?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
};

type GenerateResponse = {
  success: boolean;
  data: {
    jobId: string;
  };
};

type GenerationStatusResponse = {
  success: boolean;
  data: TaskGenerationJob;
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
        due_date_offset_days: routineTaskData.dueDateOffsetDays,
        due_date_offset_hour: routineTaskData.dueDateOffsetHour,
        start_generation_at: routineTaskData.startGenerationAt,
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
    // start_generation_atは必須なので、undefinedの場合はエラー
    if (!routineTaskData.startGenerationAt) {
      throw new Error('startGenerationAt is required');
    }

    const body: UpdateRoutineTaskRequestBody = {
      routine_task: {
        ...(routineTaskData.title !== undefined && {
          title: routineTaskData.title,
        }),
        ...(routineTaskData.frequency !== undefined && {
          frequency: routineTaskData.frequency,
        }),
        ...(routineTaskData.intervalValue !== undefined && {
          interval_value: routineTaskData.intervalValue,
        }),
        ...(routineTaskData.nextGenerationAt !== undefined && {
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
        ...(routineTaskData.dueDateOffsetDays !== undefined && {
          due_date_offset_days: routineTaskData.dueDateOffsetDays,
        }),
        ...(routineTaskData.dueDateOffsetHour !== undefined && {
          due_date_offset_hour: routineTaskData.dueDateOffsetHour,
        }),
        start_generation_at: routineTaskData.startGenerationAt, // 必須
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

  /**
   * タスク生成ジョブを開始する
   * @param routineTaskId - 習慣化タスクID
   * @returns ジョブID
   */
  generate: async (routineTaskId: number): Promise<{ jobId: string }> => {
    const response = await axios.post<GenerateResponse>(
      `/api/v1/routine_tasks/${routineTaskId}/generate`
    );
    return response.data.data;
  },

  /**
   * タスク生成ジョブのステータスを取得する
   * @param routineTaskId - 習慣化タスクID
   * @param jobId - ジョブID
   * @returns ジョブステータス情報
   */
  getGenerationStatus: async (
    routineTaskId: number,
    jobId: string
  ): Promise<TaskGenerationJob> => {
    const response = await axios.get<GenerationStatusResponse>(
      `/api/v1/routine_tasks/${routineTaskId}/generation_status`,
      {
        params: { job_id: jobId },
      }
    );
    return response.data.data;
  },
};
