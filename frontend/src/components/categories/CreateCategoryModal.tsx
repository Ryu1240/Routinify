import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Title,
  Loader,
} from '@mantine/core';
import { COLORS } from '../../constants/colors';
import { CreateCategoryDto } from '../../types/category';

type CreateCategoryModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (categoryData: CreateCategoryDto) => Promise<void>;
  loading?: boolean;
};

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('カテゴリ名は必須です');
      return;
    }

    try {
      await onSubmit({ name: name.trim() });
      handleClose();
    } catch (error) {
      console.error('カテゴリ作成エラー:', error);
      setError('カテゴリの作成に失敗しました');
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
          新しいカテゴリを作成
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
              作成
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateCategoryModal;
