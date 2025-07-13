import React from 'react';
import { Task, TaskColumn } from './types';
import { Text } from '@mantine/core';

// 日付フォーマット関数
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP');
};

// タスクテーブルのカラム定義
export const taskColumns: TaskColumn[] = [
  {
    key: 'title',
    label: 'タイトル',
    sortable: true,
    width: 'w-1/3',
    render: (task) => (
      <Text fw={500} c="dark">
        {task.title}
        {task.description && (
          <Text size="sm" c="dimmed" mt={4}>
            {task.description}
          </Text>
        )}
      </Text>
    ),
  },
  {
    key: 'category',
    label: 'カテゴリ',
    sortable: true,
    width: 'w-24',
    render: (task) => (
      <Text size="sm" c="gray">
        {task.category || '-'}
      </Text>
    ),
  },
  {
    key: 'status',
    label: 'ステータス',
    sortable: true,
    width: 'w-24',
    render: (task) => (
      <Text size="sm" c="gray">
        {task.status || '-'}
      </Text>
    ),
  },
  {
    key: 'priority',
    label: '優先度',
    sortable: true,
    width: 'w-20',
    render: (task) => (
      <Text size="sm" c="gray">
        {task.priority || '-'}
      </Text>
    ),
  },
  {
    key: 'dueDate',
    label: '期限',
    sortable: true,
    width: 'w-32',
    render: (task) => (
      <Text size="sm" c="gray">
        {formatDate(task.dueDate ?? null)}
      </Text>
    ),
  },
  {
    key: 'createdAt',
    label: '作成日',
    sortable: true,
    width: 'w-32',
    render: (task) => (
      <Text size="sm" c="gray">
        {formatDate(task.createdAt)}
      </Text>
    ),
  },
];
