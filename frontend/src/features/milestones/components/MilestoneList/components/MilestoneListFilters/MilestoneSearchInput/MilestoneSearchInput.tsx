import React from 'react';
import { Group, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';

type MilestoneSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const MilestoneSearchInput: React.FC<MilestoneSearchInputProps> = ({
  value,
  onChange,
}) => {
  return (
    <Group grow>
      <TextInput
        placeholder="マイルストーン名で検索..."
        leftSection={<IconSearch size={16} color={COLORS.PRIMARY} />}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        styles={{
          input: {
            borderColor: COLORS.LIGHT,
            '&:focus': {
              borderColor: COLORS.PRIMARY,
            },
          },
        }}
      />
    </Group>
  );
};
