import { useState } from 'react';
import { CreateMilestoneDto } from '@/types/milestone';

export const useMilestoneForm = () => {
  const [formData, setFormData] = useState<CreateMilestoneDto>({
    name: '',
    description: null,
    startDate: null,
    dueDate: null,
    status: 'planning',
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleInputChange = (
    field: keyof CreateMilestoneDto,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' && errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrors({ name: 'マイルストーン名は必須です' });
      return false;
    }
    if (formData.name.length > 255) {
      setErrors({ name: 'マイルストーン名は255文字以内で入力してください' });
      return false;
    }
    return true;
  };

  const getSubmitData = (): CreateMilestoneDto => {
    return {
      ...formData,
      description: formData.description || null,
      startDate: formData.startDate || null,
      dueDate: formData.dueDate || null,
      status: formData.status || 'planning',
    };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      startDate: null,
      dueDate: null,
      status: 'planning',
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
