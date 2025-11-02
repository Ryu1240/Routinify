import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AchievementList } from './AchievementList';
import { useAchievementsList } from '../../hooks/useAchievementsList';

export const AchievementListContainer: React.FC = () => {
  const navigate = useNavigate();
  const { routineTasksWithStats, loading, error } = useAchievementsList();

  const handleTaskClick = (id: number) => {
    navigate(`/achievements/${id}`);
  };

  return (
    <AchievementList
      routineTasksWithStats={routineTasksWithStats}
      isLoading={loading}
      error={error}
      onTaskClick={handleTaskClick}
    />
  );
};
