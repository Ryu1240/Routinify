import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Center, Stack, Title, Button, Paper, Loader, Text, Image } from '@mantine/core';
import { COLORS } from '../constants/colors';

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

  const errorMessage = error ? (
    <Text c="red" size="sm" ta="center" style={{ marginBottom: '1rem' }}>
      ログイン中にエラーが発生しました: {error.message || '不明なエラー'}
    </Text>
  ) : null;
  return (
    <Center style={{ minHeight: '100vh', background: COLORS.DARK, flexDirection: 'column' }}>
      <div style={{ 
        width: 300, 
        height: 300, 
        overflow: 'hidden', 
        borderRadius: '50%',
        marginBottom: '1.5rem',
        position: 'relative',
        boxShadow: '0 0 20px rgba(0,0,0,0.3)'
      }}>
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
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      <Paper shadow="md" p="xl" radius="md" withBorder bg={COLORS.MEDIUM}>
        <Stack align="center" gap="lg">
          <Text c="white" size="lg" fw={500}>習慣化を始めましょう</Text>
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
                loginWithRedirect();
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
