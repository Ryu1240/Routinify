import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutineTasks, useCategories } from '@/shared/hooks';
import { UpdateRoutineTaskDto } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
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
  const [routineTask, setRoutineTask] = useState<{
    lastGeneratedAt: string | null;
  } | null>(null);

  // 編集モード時にデータ取得
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      routineTasksApi
        .fetchById(Number(id))
        .then((task) => {
          setFormDataFromRoutineTask(task);
          setRoutineTask(task);
        })
        .catch((error) => {
          handleApiError(error, {
            defaultMessage: '習慣化タスクの取得に失敗しました。',
          });
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

    try {
      const routineTaskData = getSubmitData();

      if (isEditMode && id) {
        // 一度でも生成が行われた場合は、start_generation_atを送信しない
        await updateRoutineTask(
          Number(id),
          routineTaskData as UpdateRoutineTaskDto,
          { isGenerated }
        );
      } else {
        await createRoutineTask(routineTaskData);
      }
      navigate('/routine-tasks');
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          '習慣化タスクの保存に失敗しました。しばらく時間をおいて再度お試しください。',
      });
    }
  };

  // キャンセルハンドラー
  const handleCancel = () => {
    navigate('/routine-tasks');
  };

  const isGenerated =
    routineTask?.lastGeneratedAt !== null &&
    routineTask?.lastGeneratedAt !== undefined;

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
      isGenerated={isGenerated}
    />
  );
};
