import { Auth0ProviderOptions } from '@auth0/auth0-react';

// 環境変数の存在チェックとエラーログ出力
const checkEnvironmentVariable = (name: string, value: string | undefined): string => {
  if (!value) {
    console.error(`❌ 環境変数 ${name} が設定されていません。`);
    console.error(`   アプリケーションが正常に動作しない可能性があります。`);
    console.error(`   .env ファイルまたは環境変数で ${name} を設定してください。`);
    return '';
  }
  console.log(`✅ 環境変数 ${name} が正常に設定されています。`);
  return value;
};

// 必須環境変数のチェック
const domain = checkEnvironmentVariable('REACT_APP_AUTH0_DOMAIN', process.env.REACT_APP_AUTH0_DOMAIN);
const clientId = checkEnvironmentVariable('REACT_APP_AUTH0_CLIENT_ID', process.env.REACT_APP_AUTH0_CLIENT_ID);

// オプション環境変数のチェック
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;
if (!audience) {
  console.warn('⚠️  REACT_APP_AUTH0_AUDIENCE が設定されていません。一部の機能が制限される可能性があります。');
}

export const auth0Config: Auth0ProviderOptions = {
  domain,
  clientId,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/tasks`,
    audience,
    scope: "read:tasks"
  },
  cacheLocation: "localstorage",
  useRefreshTokens: true,
  // Arcブラウザ対応
  skipRedirectCallback: false
}; 