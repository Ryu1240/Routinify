import { COLORS } from '@/shared/constants/colors';

export const getPriorityColor = (priority: string | null) => {
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

export const getPriorityLabel = (priority: string | null) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '-';
  }
};

export const getStatusColor = (status: string | null) => {
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

export const getStatusLabel = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return '完了';
    case 'in_progress':
      return '進行中';
    case 'pending':
      return '未着手';
    case 'on_hold':
      return '保留';
    case 'cancelled':
      return 'キャンセル';
    default:
      return '-';
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
