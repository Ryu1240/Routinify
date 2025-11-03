import React from 'react';
import { AccountManagementPageContainer } from '@/features/users/components/AccountManagementPage';
import { Layout } from '@/shared/components';

const AccountManagementPage: React.FC = () => {
  return (
    <Layout>
      <AccountManagementPageContainer />
    </Layout>
  );
};

export default AccountManagementPage;

