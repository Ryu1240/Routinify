import { Auth0ProviderOptions } from '@auth0/auth0-react';

// 環境変数の存在チェックとエラーログ出力
const checkEnvironmentVariable = (
  name: string,
  value: string | undefined
): string => {
  if (!value) {
    const errorMessage =
      `❌ 環境変数 ${name} が設定されていません。\n` +
      `   アプリケーションが正常に動作しない可能性があります。\n` +
      `   .env ファイルまたは環境変数で ${name} を設定してください。`;
    throw new Error(errorMessage);
  }
  // eslint-disable-next-line no-console
  console.log(`✅ 環境変数 ${name} が正常に設定されています。`);
  return value;
};

// 必須環境変数のチェック
const domain = checkEnvironmentVariable(
  'REACT_APP_AUTH0_DOMAIN',
  process.env.REACT_APP_AUTH0_DOMAIN
);
const clientId = checkEnvironmentVariable(
  'REACT_APP_AUTH0_CLIENT_ID',
  process.env.REACT_APP_AUTH0_CLIENT_ID
);

const audience = checkEnvironmentVariable(
  'REACT_APP_AUTH0_AUDIENCE',
  process.env.REACT_APP_AUTH0_AUDIENCE
);

export const auth0Config: Auth0ProviderOptions = {
  domain,
  clientId,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/tasks`,
    audience,
    scope:
      'openid profile email read:tasks write:tasks delete:tasks read:routine-tasks write:routine-tasks delete:routine-tasks',
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  // Arcブラウザ対応
  skipRedirectCallback: false,
};
