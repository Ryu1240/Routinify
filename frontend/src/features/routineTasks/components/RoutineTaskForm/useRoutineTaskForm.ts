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
  dueDateOffsetDays: number | string | null;
  dueDateOffsetHour: number | string | null;
  startGenerationAt: Date | null;
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
  dueDateOffsetDays: null,
  dueDateOffsetHour: null,
  startGenerationAt: null, // ユーザーが必須で入力する
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
      dueDateOffsetDays: task.dueDateOffsetDays ?? null,
      dueDateOffsetHour: task.dueDateOffsetHour ?? null,
      startGenerationAt: task.startGenerationAt
        ? new Date(task.startGenerationAt)
        : null, // 編集時も値がない場合はnull（通常は存在するはず）
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
    if (!formData.startGenerationAt) {
      throw new Error('開始期限は必須です');
    }

    // startGenerationAtをDateオブジェクトに変換
    let startDate: Date;
    if (formData.startGenerationAt instanceof Date) {
      startDate = formData.startGenerationAt;
    } else {
      // Dateオブジェクトでない場合、変換を試みる
      startDate = new Date(formData.startGenerationAt as string | number);
      if (isNaN(startDate.getTime())) {
        throw new Error('開始期限が無効な形式です');
      }
    }

    // nextGenerationAtをDateオブジェクトに変換
    let nextDate: Date;
    if (formData.nextGenerationAt instanceof Date) {
      nextDate = formData.nextGenerationAt;
    } else {
      // Dateオブジェクトでない場合、変換を試みる
      nextDate = new Date(formData.nextGenerationAt as string | number);
      if (isNaN(nextDate.getTime())) {
        throw new Error('次回生成日時が無効な形式です');
      }
    }

    return {
      title: formData.title,
      frequency: formData.frequency,
      intervalValue:
        formData.frequency === 'custom' ? Number(formData.intervalValue) : null,
      nextGenerationAt: nextDate.toISOString(),
      maxActiveTasks: Number(formData.maxActiveTasks),
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      priority: formData.priority,
      isActive: formData.isActive,
      dueDateOffsetDays:
        formData.dueDateOffsetDays !== null && formData.dueDateOffsetDays !== ''
          ? Number(formData.dueDateOffsetDays)
          : null,
      dueDateOffsetHour:
        formData.dueDateOffsetHour !== null && formData.dueDateOffsetHour !== ''
          ? Number(formData.dueDateOffsetHour)
          : null,
      startGenerationAt: startDate.toISOString(),
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
