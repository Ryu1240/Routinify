import React from 'react';
import { MilestoneDetailContainer } from '@/features/milestones/components/MilestoneDetail';
import { Layout } from '@/shared/components';

export const MilestoneDetailPage: React.FC = () => {
  return (
    <Layout>
      <MilestoneDetailContainer />
    </Layout>
  );
};
