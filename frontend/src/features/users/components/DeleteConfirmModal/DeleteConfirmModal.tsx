import React from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Loader,
} from '@mantine/core';

type DeleteConfirmModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userId: string;
  userName?: string;
  loading?: boolean;
};

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  opened,
  onClose,
  onConfirm,
  userName,
  loading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // エラーは親コンポーネントで処理される
      console.error('削除に失敗しました:', error);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>アカウントの削除</Title>}
      centered
      size="md"
    >
      <Stack gap="md">
        <Text>
          このアカウントを削除してもよろしいですか？
          {userName && (
            <>
              <br />
              <Text span fw={500}>
                「{userName}」
              </Text>
            </>
          )}
        </Text>
        <Text size="sm" c="dimmed">
          この操作は取り消すことができません。アカウントと関連するデータは完全に削除されます。
        </Text>
        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={loading}
            leftSection={loading ? <Loader size={16} /> : null}
          >
            削除
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
