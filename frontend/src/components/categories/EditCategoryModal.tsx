import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Title,
  Loader,
} from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';
import { Category, UpdateCategoryDto } from '@/types/category';

type EditCategoryModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (
    categoryId: number,
    categoryData: UpdateCategoryDto
  ) => Promise<void>;
  category: Category | null;
  loading?: boolean;
};

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  opened,
  onClose,
  onSubmit,
  category,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('カテゴリ名は必須です');
      return;
    }

    if (!category) {
      return;
    }

    try {
      await onSubmit(category.id, { name: name.trim() });
      handleClose();
    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
      setError('カテゴリの更新に失敗しました');
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Title order={3} c={COLORS.PRIMARY}>
          カテゴリを編集
        </Title>
      }
      size="sm"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="カテゴリ名"
            placeholder="カテゴリ名を入力してください"
            withAsterisk
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              if (error) setError(null);
            }}
            error={error}
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
            autoFocus
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              color={COLORS.PRIMARY}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              loading={loading}
              color={COLORS.PRIMARY}
              leftSection={loading ? <Loader size={16} /> : undefined}
            >
              更新
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditCategoryModal;
