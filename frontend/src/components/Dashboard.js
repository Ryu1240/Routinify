import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

function Dashboard() {
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get('http://localhost:3000/api/v1/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTasks(response.data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'タスクの取得に失敗しました';
        setError(errorMessage);
        setLoading(false);
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, [getAccessTokenSilently]);

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
                  onClick={() => logout({ returnTo: window.location.origin })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ダッシュボード</h2>
            
            {/* ユーザー情報セクション */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">ユーザー情報</h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">名前</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* タスク一覧セクション */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">タスク一覧</h3>
              </div>
              <div className="border-t border-gray-200">
                {loading ? (
                  <div className="px-4 py-5 sm:px-6 text-center">読み込み中...</div>
                ) : error ? (
                  <div className="px-4 py-5 sm:px-6 text-center text-red-600">{error}</div>
                ) : (
                  <div className="px-4 py-5 sm:px-6">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(tasks, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 