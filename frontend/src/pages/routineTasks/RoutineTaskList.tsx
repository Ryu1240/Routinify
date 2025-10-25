import React from 'react';
import { RoutineTaskListContainer } from '@/features/routineTasks/components/RoutineTaskList';
import { Layout } from '@/shared/components';

const RoutineTaskList: React.FC = () => {
  return (
    <Layout>
      <RoutineTaskListContainer />
    </Layout>
  );
};

export default RoutineTaskList;
