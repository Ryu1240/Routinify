import React from 'react';
import Header from '../Header';

const TaskList: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg m-6">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">タスク一覧</h2>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <p className="text-gray-600">タスク一覧がここに表示されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList; 