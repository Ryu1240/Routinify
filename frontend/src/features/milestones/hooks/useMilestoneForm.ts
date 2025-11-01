import { useState } from 'react';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  Milestone,
} from '@/types/milestone';

export const useMilestoneForm = (initialData?: Milestone) => {
  const [formData, setFormData] = useState<CreateMilestoneDto>({
    name: initialData?.name || '',
    description: initialData?.description || null,
    startDate: initialData?.startDate || null,
    dueDate: initialData?.dueDate || null,
    status: initialData?.status || 'planning',
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
    if (!formData.name || !formData.name.trim()) {
      setErrors({ name: 'マイルストーン名は必須です' });
      return false;
    }
    if (formData.name.length > 255) {
      setErrors({ name: 'マイルストーン名は255文字以内で入力してください' });
      return false;
    }
    return true;
  };

  const getCreateData = (): CreateMilestoneDto => {
    return {
      name: formData.name || '',
      description: formData.description || null,
      startDate: formData.startDate || null,
      dueDate: formData.dueDate || null,
      status: formData.status || 'planning',
    };
  };

  const getUpdateData = (): UpdateMilestoneDto => {
    if (!initialData) {
      // 初期データがない場合は空のオブジェクトを返す
      return {};
    }

    const updateData: UpdateMilestoneDto = {};
    
    // 初期データと比較して、変更されたフィールドのみを追加
    if (formData.name !== undefined && formData.name !== initialData.name) {
      updateData.name = formData.name;
    }
    if (formData.description !== undefined && formData.description !== initialData.description) {
      updateData.description = formData.description;
    }
    if (formData.startDate !== undefined && formData.startDate !== initialData.startDate) {
      updateData.startDate = formData.startDate;
    }
    if (formData.dueDate !== undefined && formData.dueDate !== initialData.dueDate) {
      updateData.dueDate = formData.dueDate;
    }
    if (formData.status !== undefined && formData.status !== initialData.status) {
      updateData.status = formData.status;
    }
    
    return updateData;
  };

  const resetForm = () => {
    setFormData({
      name: initialData?.name || '',
      description: initialData?.description || null,
      startDate: initialData?.startDate || null,
      dueDate: initialData?.dueDate || null,
      status: initialData?.status || 'planning',
    });
    setErrors({});
  };

  const setInitialData = (data: Milestone) => {
    setFormData({
      name: data.name,
      description: data.description || null,
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
      status: data.status,
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getCreateData,
    getUpdateData,
    resetForm,
    setInitialData,
  };
};
