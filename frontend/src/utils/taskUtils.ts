import { COLORS } from '../constants/colors';

export const getPriorityColor = (
  priority: string | null | undefined
): string => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return COLORS.PRIMARY;
    case 'medium':
      return COLORS.MEDIUM;
    case 'low':
      return COLORS.LIGHT;
    default:
      return COLORS.GRAY;
  }
};

export const getStatusColor = (status: string | null | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return COLORS.PRIMARY;
    case 'in_progress':
      return COLORS.MEDIUM;
    case 'pending':
      return COLORS.LIGHT;
    case 'on_hold':
      return COLORS.GRAY;
    case 'cancelled':
      return COLORS.GRAY;
    default:
      return COLORS.GRAY;
  }
};

export const getStatusLabel = (status: string | null | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '未着手';
    case 'in_progress':
      return '進行中';
    case 'completed':
      return '完了';
    case 'on_hold':
      return '保留';
    default:
      return status || '-';
  }
};

export const getPriorityLabel = (
  priority: string | null | undefined
): string => {
  switch (priority?.toLowerCase()) {
    case 'low':
      return '低';
    case 'medium':
      return '中';
    case 'high':
      return '高';
    default:
      return priority || '-';
  }
};

export const getCategoryColor = (category: string | null) => {
  if (!category) return COLORS.GRAY;
  const brandColors = [
    COLORS.PRIMARY,
    COLORS.MEDIUM,
    COLORS.LIGHT,
    COLORS.DARK,
  ];
  const index = category.charCodeAt(0) % brandColors.length;
  return brandColors[index];
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP');
};
