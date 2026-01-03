import React from 'react';
import { Layout } from '@/shared/components';
import { DashboardContainer } from '@/features/dashboard/components/Dashboard';

const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <DashboardContainer />
    </Layout>
  );
};

export default DashboardPage;
