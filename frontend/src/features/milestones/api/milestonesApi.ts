import axios from '@/lib/axios';
import { Milestone, MilestoneFilters } from '@/types/milestone';

type MilestoneResponse = {
  data: Milestone[];
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
};
