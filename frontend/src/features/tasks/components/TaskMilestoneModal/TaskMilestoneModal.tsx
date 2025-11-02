import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Group,
  Title,
  Loader,
  Text,
  Table,
  Badge,
  TextInput,
  Stack,
  Checkbox,
} from '@mantine/core';
import { IconFlag, IconSearch } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Milestone } from '@/types/milestone';

type TaskMilestoneModalProps = {
  opened: boolean;
  onClose: () => void;
  onAssociate: (milestoneIds: number[]) => Promise<void>;
  onDissociate: (milestoneIds: number[]) => Promise<void>;
  loading?: boolean;
  currentMilestoneIds?: number[]; // 現在紐付けられているマイルストーンIDの配列
  milestones?: Milestone[]; // 選択可能なマイルストーン一覧
};

export const TaskMilestoneModal: React.FC<TaskMilestoneModalProps> = ({
  opened,
  onClose,
  onAssociate,
  onDissociate,
  loading = false,
  currentMilestoneIds = [],
  milestones = [],
}) => {
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<number[]>(
    []
  );
  const [dissociateMilestoneIds, setDissociateMilestoneIds] = useState<
    number[]
  >([]);

  useEffect(() => {
    if (opened) {
      setSearchQuery('');
      setSelectedMilestoneIds([]);
      setDissociateMilestoneIds([]);
    }
  }, [opened]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMilestones(milestones);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMilestones(
        milestones.filter(
          (milestone) =>
            milestone.name.toLowerCase().includes(query) ||
            milestone.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, milestones]);

  const handleToggleMilestone = (milestoneId: number) => {
    const isCurrentlyAssociated = currentMilestoneIds.includes(milestoneId);
    const isSelected = selectedMilestoneIds.includes(milestoneId);
    const isDissociateSelected = dissociateMilestoneIds.includes(milestoneId);

    if (isCurrentlyAssociated) {
      // 既に紐付けられている場合は解除リストをトグル
      setDissociateMilestoneIds((prev) =>
        isDissociateSelected
          ? prev.filter((id) => id !== milestoneId)
          : [...prev, milestoneId]
      );
      // 選択リストからも削除
      setSelectedMilestoneIds((prev) =>
        prev.filter((id) => id !== milestoneId)
      );
    } else {
      // まだ紐付けられていない場合は選択リストをトグル
      setSelectedMilestoneIds((prev) =>
        isSelected
          ? prev.filter((id) => id !== milestoneId)
          : [...prev, milestoneId]
      );
      // 解除リストからも削除
      setDissociateMilestoneIds((prev) =>
        prev.filter((id) => id !== milestoneId)
      );
    }
  };

  const handleSelectAll = () => {
    const availableMilestones = filteredMilestones.filter(
      (m) => !currentMilestoneIds.includes(m.id)
    );
    if (selectedMilestoneIds.length === availableMilestones.length) {
      setSelectedMilestoneIds([]);
    } else {
      setSelectedMilestoneIds(availableMilestones.map((m) => m.id));
    }
  };

  const handleSave = async () => {
    try {
      // 新しいマイルストーンの紐付け
      if (selectedMilestoneIds.length > 0) {
        await onAssociate(selectedMilestoneIds);
      }
      // 既存マイルストーンの解除
      if (dissociateMilestoneIds.length > 0) {
        await onDissociate(dissociateMilestoneIds);
      }
      onClose();
    } catch (err) {
      console.error('マイルストーンの変更に失敗:', err);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedMilestoneIds([]);
    setDissociateMilestoneIds([]);
    onClose();
  };

  const availableMilestones = filteredMilestones.filter(
    (m) => !currentMilestoneIds.includes(m.id)
  );
  const allSelected =
    availableMilestones.length > 0 &&
    selectedMilestoneIds.length === availableMilestones.length;
  const someSelected =
    selectedMilestoneIds.length > 0 &&
    selectedMilestoneIds.length < availableMilestones.length;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Title order={3} c={COLORS.PRIMARY}>
          マイルストーンを管理
        </Title>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        <TextInput
          placeholder="マイルストーンを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />

        {filteredMilestones.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {searchQuery.trim() === ''
              ? 'マイルストーンがありません'
              : '検索結果が見つかりません'}
          </Text>
        ) : (
          <>
            {availableMilestones.length > 0 && (
              <Group justify="space-between">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  label={`新規追加: 全選択 (${selectedMilestoneIds.length}/${availableMilestones.length})`}
                />
              </Group>
            )}
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '40px' }}></Table.Th>
                  <Table.Th>マイルストーン名</Table.Th>
                  <Table.Th>ステータス</Table.Th>
                  <Table.Th>期限日</Table.Th>
                  <Table.Th>進捗</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredMilestones.map((milestone) => {
                  const isCurrentlyAssociated = currentMilestoneIds.includes(
                    milestone.id
                  );
                  const isSelected = selectedMilestoneIds.includes(
                    milestone.id
                  );
                  const isDissociateSelected = dissociateMilestoneIds.includes(
                    milestone.id
                  );

                  return (
                    <Table.Tr
                      key={milestone.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          isSelected || isDissociateSelected
                            ? COLORS.LIGHT + '20'
                            : isCurrentlyAssociated
                              ? COLORS.PRIMARY + '10'
                              : 'transparent',
                      }}
                      onClick={() => handleToggleMilestone(milestone.id)}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={
                            isSelected ||
                            (isCurrentlyAssociated && !isDissociateSelected)
                          }
                          indeterminate={isDissociateSelected}
                          onChange={() => handleToggleMilestone(milestone.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconFlag size={16} color={COLORS.PRIMARY} />
                          <Text fw={500}>{milestone.name}</Text>
                          {isCurrentlyAssociated && (
                            <Badge size="sm" color="blue" variant="light">
                              紐付け済み
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            milestone.status === 'completed'
                              ? 'green'
                              : milestone.status === 'cancelled'
                                ? 'gray'
                                : milestone.status === 'in_progress'
                                  ? 'blue'
                                  : 'yellow'
                          }
                          variant="light"
                        >
                          {milestone.status === 'planning'
                            ? '計画中'
                            : milestone.status === 'in_progress'
                              ? '進行中'
                              : milestone.status === 'completed'
                                ? '完了'
                                : 'キャンセル'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={COLORS.GRAY}>
                          {milestone.dueDate || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={COLORS.GRAY}>
                          {milestone.progressPercentage}% (
                          {milestone.completedTasksCount}/
                          {milestone.totalTasksCount})
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={
              (selectedMilestoneIds.length === 0 &&
                dissociateMilestoneIds.length === 0) ||
              loading
            }
            color={COLORS.PRIMARY}
            leftSection={
              loading ? <Loader size={16} /> : <IconFlag size={16} />
            }
          >
            保存 (
            {selectedMilestoneIds.length > 0 &&
              `+${selectedMilestoneIds.length}`}
            {dissociateMilestoneIds.length > 0 &&
              `${selectedMilestoneIds.length > 0 ? ' / ' : ''}-${dissociateMilestoneIds.length}`}
            )
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
