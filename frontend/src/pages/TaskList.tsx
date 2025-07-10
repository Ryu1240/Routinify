import React from 'react';
import { Container, Title, Paper } from '@mantine/core';
import TaskListComponent from '../components/tasks/TaskList';
import Layout from '../components/common/Layout';

const TaskList: React.FC = () => {
  return (
    <Layout>
      <TaskListComponent />
    </Layout>
  );
};

export default TaskList; 