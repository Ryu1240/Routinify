import React from 'react';
import TaskListComponent from '../components/tasks/TaskList';
import Layout from '../components/Layout';

const TaskList: React.FC = () => {
  return (
    <Layout>
      <TaskListComponent />
    </Layout>
  );
};

export default TaskList; 