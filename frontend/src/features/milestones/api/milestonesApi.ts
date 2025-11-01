import axios from '@/lib/axios';
import {
  Milestone,
  MilestoneFilters,
  CreateMilestoneDto,
} from '@/types/milestone';

type MilestoneResponse = {
  data: Milestone[];
};

type MilestoneCreateResponse = {
  success: boolean;
  message: string;
  data: Milestone;
};

type MilestoneRequestBody = {
  milestone: {
    name: string;
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

  create: async (milestoneData: CreateMilestoneDto): Promise<void> => {
    const body: MilestoneRequestBody = {
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
};
