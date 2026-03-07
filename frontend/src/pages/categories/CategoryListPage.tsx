import React from 'react';
import { CategoryListContainer } from '@/features/categories/components/CategoryList';
import { Layout } from '@/shared/components';

const CategoryListPage: React.FC = () => {
  return (
    <Layout>
      <CategoryListContainer />
    </Layout>
  );
};

export default CategoryListPage;
