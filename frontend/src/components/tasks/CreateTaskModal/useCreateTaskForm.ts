import { useState } from 'react';
import { CreateTaskData } from '../definitions/types';

export const useCreateTaskForm = () => {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    dueDate: null,
    status: '未着手',
    priority: 'medium',
    category: '',
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleInputChange = (
    field: keyof CreateTaskData,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'title' && errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setErrors({ title: 'タスク名は必須です' });
      return false;
    }
    return true;
  };

  const getSubmitData = (): CreateTaskData => {
    return {
      ...formData,
      dueDate: formData.dueDate || null,
      category: formData.category?.trim() || null,
    };
  };

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: null,
      status: '未着手',
      priority: 'medium',
      category: '',
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getSubmitData,
    resetForm,
  };
};
