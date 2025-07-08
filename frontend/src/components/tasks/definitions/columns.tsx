import React from 'react';
import { Task, TaskColumn } from './types';

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
      <div className="font-medium text-gray-900">
        {task.title}
        {task.description && (
          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        )}
      </div>
    )
  },
  {
    key: 'category',
    label: 'カテゴリ',
    sortable: true,
    width: 'w-24',
    render: (task) => (
      <span className="text-sm text-gray-600">
        {task.category || '-'}
      </span>
    )
  },
  {
    key: 'status',
    label: 'ステータス',
    sortable: true,
    width: 'w-24',
    render: (task) => (
      <span className="text-sm text-gray-600">
        {task.status || '-'}
      </span>
    )
  },
  {
    key: 'priority',
    label: '優先度',
    sortable: true,
    width: 'w-20',
    render: (task) => (
      <span className="text-sm text-gray-600">
        {task.priority || '-'}
      </span>
    )
  },
  {
    key: 'dueDate',
    label: '期限',
    sortable: true,
    width: 'w-32',
    render: (task) => (
      <span className="text-sm text-gray-600">
        {formatDate(task.dueDate ?? null)}
      </span>
    )
  },
  {
    key: 'createdAt',
    label: '作成日',
    sortable: true,
    width: 'w-32',
    render: (task) => (
      <span className="text-sm text-gray-600">
        {formatDate(task.createdAt)}
      </span>
    )
  }
]; 