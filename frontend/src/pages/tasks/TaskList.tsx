import React from 'react';
import { TaskListContainer } from '@/features/tasks/components/TaskList';
import { Layout } from '@/shared/components';

const TaskList: React.FC = () => {
  return (
    <Layout>
      <TaskListContainer />
    </Layout>
  );
};

export default TaskList;
