import { useState, useCallback } from 'react';
import {
  RoutineTask,
  RoutineTaskFrequency,
  RoutineTaskPriority,
  CreateRoutineTaskDto,
} from '@/types';

type FormData = {
  title: string;
  frequency: RoutineTaskFrequency;
  intervalValue: number | string;
  nextGenerationAt: Date;
  maxActiveTasks: number | string;
  categoryId: string | null;
  priority: RoutineTaskPriority | null;
  isActive: boolean;
};

type UseRoutineTaskFormReturn = {
  formData: FormData;
  setFormDataFromRoutineTask: (task: RoutineTask) => void;
  handleInputChange: (
    field: keyof FormData,
    value: string | number | Date | boolean | null
  ) => void;
  getSubmitData: () => CreateRoutineTaskDto;
  resetForm: () => void;
};

const getInitialFormData = (): FormData => ({
  title: '',
  frequency: 'daily',
  intervalValue: 1,
  nextGenerationAt: new Date(),
  maxActiveTasks: 3,
  categoryId: null,
  priority: null,
  isActive: true,
});

export const useRoutineTaskForm = (): UseRoutineTaskFormReturn => {
  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  // 編集モード時にRoutineTaskから初期値を設定
  const setFormDataFromRoutineTask = useCallback((task: RoutineTask) => {
    setFormData({
      title: task.title,
      frequency: task.frequency,
      intervalValue: task.intervalValue ?? 1,
      nextGenerationAt: new Date(task.nextGenerationAt),
      maxActiveTasks: task.maxActiveTasks,
      categoryId: task.categoryId?.toString() ?? null,
      priority: task.priority,
      isActive: task.isActive,
    });
  }, []);

  // フォームの入力変更ハンドラー
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | number | Date | boolean | null) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // フォームデータをDTOに変換
  const getSubmitData = useCallback((): CreateRoutineTaskDto => {
    return {
      title: formData.title,
      frequency: formData.frequency,
      intervalValue:
        formData.frequency === 'custom' ? Number(formData.intervalValue) : null,
      nextGenerationAt: formData.nextGenerationAt.toISOString(),
      maxActiveTasks: Number(formData.maxActiveTasks),
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      priority: formData.priority,
      isActive: formData.isActive,
    };
  }, [formData]);

  // フォームリセット
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, []);

  return {
    formData,
    setFormDataFromRoutineTask,
    handleInputChange,
    getSubmitData,
    resetForm,
  };
};
