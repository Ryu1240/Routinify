import { useState } from 'react';
import { CreateTaskDto } from '../../../types';

export const useCreateTaskForm = () => {
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    dueDate: null,
    status: 'pending',
    priority: 'medium',
    categoryId: null,
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleInputChange = (
    field: keyof CreateTaskDto,
    value: string | number | null
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

  const getSubmitData = (): CreateTaskDto => {
    return {
      ...formData,
      dueDate: formData.dueDate || null,
      categoryId: formData.categoryId || null,
    };
  };

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: null,
      status: 'pending',
      priority: 'medium',
      categoryId: null,
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
