import React from 'react';
import { CategoryList as CategoryListComponent } from '../../components/categories';
import { Layout } from '../../components/common';

const CategoryList: React.FC = () => {
  return (
    <Layout>
      <CategoryListComponent />
    </Layout>
  );
};

export default CategoryList;
