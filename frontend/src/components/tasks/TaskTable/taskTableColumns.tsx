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

export const taskColumns: (TableColumn & {
  render: (task: Task) => React.ReactNode;
})[] = [
  {
    key: 'title',
    label: 'タスク名',
    sortable: true,
    render: (task) => <Text fw={500}>{task.title}</Text>,
  },
  {
    key: 'category',
    label: 'カテゴリ',
    sortable: true,
    render: (task) => (
      <Badge color={getCategoryColor(task.category || null)} variant="light">
        {task.category || '-'}
      </Badge>
    ),
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

// テーブルヘッダー用のカラム定義（render関数を除外）
export const tableColumns: TableColumn[] = taskColumns.map(({ render, ...column }) => column);
