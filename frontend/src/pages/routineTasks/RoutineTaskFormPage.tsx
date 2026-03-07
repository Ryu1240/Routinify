import React from 'react';
import { RoutineTaskFormContainer } from '@/features/routineTasks/components/RoutineTaskForm';
import { Layout } from '@/shared/components';

const RoutineTaskFormPage: React.FC = () => {
  return (
    <Layout>
      <RoutineTaskFormContainer />
    </Layout>
  );
};

export default RoutineTaskFormPage;
