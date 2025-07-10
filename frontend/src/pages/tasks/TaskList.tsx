import React from 'react';
import { TaskList as TaskListComponent } from '../../components/tasks';
import { Layout } from '../../components/common';

const TaskList: React.FC = () => {
  return (
    <Layout>
      <TaskListComponent />
    </Layout>
  );
};

export default TaskList; 