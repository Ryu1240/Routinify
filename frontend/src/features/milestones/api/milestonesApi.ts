import axios from '@/lib/axios';
import {
  Milestone,
  MilestoneFilters,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from '@/types/milestone';

type MilestoneResponse = {
  data: Milestone[];
};

type MilestoneDetailResponse = {
  success: boolean;
  data: Milestone;
};

type MilestoneCreateResponse = {
  success: boolean;
  message: string;
  data: Milestone;
};

type CreateMilestoneRequestBody = {
  milestone: {
    name: string;
    description?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    status?: string;
  };
};

type UpdateMilestoneRequestBody = {
  milestone: {
    name?: string;
    description?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    status?: string;
  };
};
export const milestonesApi = {
  getAll: async (filters?: MilestoneFilters): Promise<Milestone[]> => {
    const params: Record<string, string> = {};

    if (filters?.status) params.status = filters.status;
    if (filters?.dueDateRange) params.due_date_range = filters.dueDateRange;
    if (filters?.search) params.q = filters.search;
    if (filters?.sortBy) params.sort_by = filters.sortBy;
    if (filters?.sortOrder) params.sort_order = filters.sortOrder;

    const response = await axios.get<MilestoneResponse>('/api/v1/milestones', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<Milestone> => {
    const response = await axios.get<MilestoneDetailResponse>(
      `/api/v1/milestones/${id}`
    );
    return response.data.data;
  },

  create: async (milestoneData: CreateMilestoneDto): Promise<void> => {
    const body: CreateMilestoneRequestBody = {
      milestone: {
        name: milestoneData.name,
        description: milestoneData.description || null,
        start_date: milestoneData.startDate || null,
        due_date: milestoneData.dueDate || null,
        status: milestoneData.status,
      },
    };
    await axios.post<MilestoneCreateResponse>('/api/v1/milestones', body);
  },

  update: async (
    id: number,
    milestoneData: UpdateMilestoneDto
  ): Promise<Milestone> => {
    const body: UpdateMilestoneRequestBody = {
      milestone: {},
    };

    // undefinedでないフィールドのみを追加
    if (milestoneData.name !== undefined) {
      body.milestone.name = milestoneData.name;
    }
    if (milestoneData.description !== undefined) {
      body.milestone.description = milestoneData.description;
    }
    if (milestoneData.startDate !== undefined) {
      body.milestone.start_date = milestoneData.startDate;
    }
    if (milestoneData.dueDate !== undefined) {
      body.milestone.due_date = milestoneData.dueDate;
    }
    if (milestoneData.status !== undefined) {
      body.milestone.status = milestoneData.status;
    }

    const response = await axios.put<MilestoneDetailResponse>(
      `/api/v1/milestones/${id}`,
      body
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/milestones/${id}`);
  },
};
