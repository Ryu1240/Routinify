import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import {
  Center,
  Stack,
  Button,
  Paper,
  Loader,
  Text,
  Image,
} from '@mantine/core';
import { COLORS } from '@/constants/colors';
import styles from './Login.module.css';

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/tasks');
    }
  }, [isAuthenticated, navigate]);

  // ログイン処理の状態管理
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  if (isLoading) {
    return (
      <Center style={{ minHeight: '100vh', background: COLORS.DARK }}>
        <Loader size="xl" color="brand" />
      </Center>
    );
  }

  // エラーが発生した場合でも、ログイン画面を表示する
  // エラーはコンソールに出力するのみ
  if (error) {
    console.error('Auth0 error:', error);
  }

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: COLORS.DARK,
        flexDirection: 'column',
      }}
    >
      <div className={styles.logoCircle}>
        <Image
          src="/Routinify-Logo.png"
          alt="Routinify Logo"
          width={450}
          height={450}
          style={{
            objectFit: 'cover',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      <Paper shadow="md" p="xl" radius="md" withBorder bg={COLORS.MEDIUM}>
        <Stack align="center" gap="lg">
          <Text c="white" size="lg" fw={500}>
            習慣化を始めましょう
          </Text>
          <Button
            size="md"
            radius="md"
            color="brand"
            style={{ width: 220 }}
            loading={isLoggingIn}
            disabled={isLoggingIn}
            onClick={() => {
              if (isLoggingIn) return; // 重複クリックを防ぐ

              setIsLoggingIn(true);
              try {
                loginWithRedirect({
                  openUrl(url) {
                    // Arcブラウザで新しいタブが開くのを防ぐため、window.location.replaceを使用
                    window.location.replace(url);
                  },
                });
              } catch (err) {
                console.error('Login error:', err);
                setIsLoggingIn(false);
              }
            }}
          >
            {isLoggingIn ? 'ログイン中...' : 'ログイン'}
          </Button>
          <Text size="sm" c="gray.4" ta="center">
            アカウントをお持ちでない場合は、ログインボタンをクリックして新規登録できます
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
};

export default Login;
