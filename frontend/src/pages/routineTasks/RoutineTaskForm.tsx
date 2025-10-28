import React from 'react';
import { RoutineTaskFormContainer } from '@/features/routineTasks/components/RoutineTaskForm';
import { Layout } from '@/shared/components';

export const RoutineTaskForm: React.FC = () => {
  return (
    <Layout>
      <RoutineTaskFormContainer />
    </Layout>
  );
};
