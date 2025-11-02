// テーブルヘッダーの定義
export type TableColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  isAction?: boolean;
};

// ソート方向の型
export type SortDirection = 'asc' | 'desc' | null;
