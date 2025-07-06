import React from 'react';
import TaskListComponent from '../components/tasks/TaskList';

const TaskList: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TaskListComponent />
        </div>
      </main>
    </div>
  );
};

export default TaskList; 