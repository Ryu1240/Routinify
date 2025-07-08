import React from 'react';
import { Container, Title, Paper } from '@mantine/core';
import TaskListComponent from '../components/tasks/TaskList';
import Layout from '../components/Layout';

const TaskList: React.FC = () => {
  return (
    <Layout>
      <Container size="xl">
        <Title order={1} mb="lg" color="dark">
          タスク一覧
        </Title>
        <Paper shadow="xs" p="md" radius="md" withBorder>
          <TaskListComponent />
        </Paper>
      </Container>
    </Layout>
  );
};

export default TaskList; 