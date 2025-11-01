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

type DeleteMilestoneConfirmModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  milestoneName?: string;
  loading?: boolean;
};

export const DeleteMilestoneConfirmModal: React.FC<
  DeleteMilestoneConfirmModalProps
> = ({ opened, onClose, onConfirm, milestoneName, loading = false }) => {
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
      title={<Title order={4}>マイルストーンの削除</Title>}
      centered
      size="md"
    >
      <Stack gap="md">
        <Text>
          このマイルストーンを削除してもよろしいですか？
          {milestoneName && (
            <>
              <br />
              <Text span fw={500}>
                「{milestoneName}」
              </Text>
            </>
          )}
        </Text>
        <Text size="sm" c="dimmed">
          関連付けられたタスクは削除されませんが、マイルストーンとの関連付けは解除されます。
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
