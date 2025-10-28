import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutineTasks, useCategories } from '@/shared/hooks';
import { UpdateRoutineTaskDto } from '@/types';
import { routineTasksApi } from '../../api/routineTasksApi';
import { useRoutineTaskForm } from './useRoutineTaskForm';
import { RoutineTaskForm } from './RoutineTaskForm';

export const RoutineTaskFormContainer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined && id !== 'new';

  const { createRoutineTask, updateRoutineTask, createLoading, updateLoading } =
    useRoutineTasks();
  const { categories } = useCategories();

  const {
    formData,
    setFormDataFromRoutineTask,
    handleInputChange,
    getSubmitData,
  } = useRoutineTaskForm();

  const [loading, setLoading] = useState(false);

  // 編集モード時にデータ取得
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      routineTasksApi
        .fetchById(Number(id))
        .then((task) => {
          setFormDataFromRoutineTask(task);
        })
        .catch((error) => {
          console.error('習慣化タスクの取得に失敗:', error);
          alert('習慣化タスクの取得に失敗しました');
          navigate('/routine-tasks');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, id, navigate, setFormDataFromRoutineTask]);

  // フォーム送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const routineTaskData = getSubmitData();

    try {
      if (isEditMode && id) {
        await updateRoutineTask(
          Number(id),
          routineTaskData as UpdateRoutineTaskDto
        );
      } else {
        await createRoutineTask(routineTaskData);
      }
      navigate('/routine-tasks');
    } catch (error) {
      console.error('習慣化タスクの保存に失敗:', error);
    }
  };

  // キャンセルハンドラー
  const handleCancel = () => {
    navigate('/routine-tasks');
  };

  return (
    <RoutineTaskForm
      isEditMode={isEditMode}
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      submitLoading={createLoading || updateLoading}
      categories={categories}
    />
  );
};
