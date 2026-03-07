import React from 'react';
import { RoutineTaskListContainer } from '@/features/routineTasks/components/RoutineTaskList';
import { Layout } from '@/shared/components';

const RoutineTaskListPage: React.FC = () => {
  return (
    <Layout>
      <RoutineTaskListContainer />
    </Layout>
  );
};

export default RoutineTaskListPage;
