import React from 'react';
import { AchievementListContainer } from '@/features/achievements/components/AchievementList';
import { Layout } from '@/shared/components';

export const AchievementListPage: React.FC = () => {
  return (
    <Layout>
      <AchievementListContainer />
    </Layout>
  );
};
