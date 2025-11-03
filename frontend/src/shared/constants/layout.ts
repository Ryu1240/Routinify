// レイアウト関連の定数
export const LAYOUT_CONSTANTS = {
  // サイドバー
  SIDEBAR_WIDTH: 280,

  // ヘッダー
  HEADER_HEIGHT: 60,
  ADMIN_BAR_HEIGHT: 36,

  // レスポンシブブレークポイント
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,

  // パディング・マージン
  CONTAINER_PADDING: 24,
  SECTION_MARGIN: 16,

  // ボーダー・シャドウ
  BORDER_RADIUS: 8,
  SHADOW_SIZE: 'sm',
} as const;

// 型定義
export type LayoutConstants = typeof LAYOUT_CONSTANTS;
