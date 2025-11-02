import React from 'react';
import { AchievementDetailContainer } from '@/features/achievements/components/AchievementDetail';
import { Layout } from '@/shared/components';

export const AchievementDetailPage: React.FC = () => {
  return (
    <Layout>
      <AchievementDetailContainer />
    </Layout>
  );
};
