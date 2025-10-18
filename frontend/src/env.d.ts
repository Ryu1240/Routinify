/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly REACT_APP_AUTH0_DOMAIN: string;
    readonly REACT_APP_AUTH0_CLIENT_ID: string;
    readonly REACT_APP_AUTH0_AUDIENCE: string;
    readonly REACT_APP_API_URL: string;
  }
}

// Windowオブジェクトの拡張（必要に応じて）
interface Window {
  // カスタムプロパティがあればここに追加
}
