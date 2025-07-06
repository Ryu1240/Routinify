import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const TaskList: React.FC = () => {
  const { user, logout } = useAuth0();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Routinify</h1>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  {user?.name}
                </div>
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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