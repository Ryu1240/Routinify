import React from 'react';
import { Text, Badge } from '@mantine/core';
import { COLORS } from '../../../constants/colors';
import {
  getPriorityColor,
  getStatusColor,
  getCategoryColor,
  formatDate,
} from '../../../utils/taskUtils';
import { TableColumn } from '../../common/DataTable/index';
import { Task } from '../definitions';
import { Category } from '../../../types/category';

// カテゴリ名を取得するヘルパー関数
const getCategoryName = (task: Task, categories: Category[]): string => {
  if (!task.categoryId) return '-';
  const category = categories.find((cat) => cat.id === task.categoryId);
  return category?.name || '-';
};

export const createTaskColumns = (
  categories: Category[] = []
): (TableColumn & {
  render: (task: Task) => React.ReactNode;
})[] => [
  {
    key: 'title',
    label: 'タスク名',
    sortable: true,
    render: (task) => <Text fw={500}>{task.title}</Text>,
  },
  {
    key: 'categoryId',
    label: 'カテゴリ',
    sortable: true,
    render: (task) => {
      const categoryName = getCategoryName(task, categories);
      return (
        <Badge color={getCategoryColor(categoryName)} variant="light">
          {categoryName}
        </Badge>
      );
    },
  },
  {
    key: 'priority',
    label: '優先度',
    sortable: true,
    render: (task) => (
      <Badge color={getPriorityColor(task.priority || null)} variant="light">
        {task.priority || '-'}
      </Badge>
    ),
  },
  {
    key: 'status',
    label: 'ステータス',
    sortable: true,
    render: (task) => (
      <Badge color={getStatusColor(task.status || null)} variant="light">
        {task.status || '-'}
      </Badge>
    ),
  },
  {
    key: 'dueDate',
    label: '期限',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.dueDate || null)}
      </Text>
    ),
  },
  {
    key: 'createdAt',
    label: '作成日',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.createdAt)}
      </Text>
    ),
  },
  {
    key: 'actions',
    label: '操作',
    isAction: true,
    render: () => null, // アクション列は TaskTableRow で個別にレンダリング
  },
];

// テーブルヘッダー用のカラム定義を生成する関数
export const createTableColumns = (
  categories: Category[] = []
): TableColumn[] =>
  createTaskColumns(categories).map(({ render: _render, ...column }) => column);

// 後方互換性のため、デフォルトエクスポート（カテゴリなし）も提供
export const taskColumns = createTaskColumns([]);
export const tableColumns = createTableColumns([]);
