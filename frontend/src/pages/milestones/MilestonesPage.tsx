import React from 'react';
import { MilestoneListContainer } from '@/features/milestones/components/MilestoneList';
import { Layout } from '@/shared/components';

const MilestonesPage: React.FC = () => {
  return (
    <Layout>
      <MilestoneListContainer />
    </Layout>
  );
};

export default MilestonesPage;

