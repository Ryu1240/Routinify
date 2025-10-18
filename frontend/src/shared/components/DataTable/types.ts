// テーブルヘッダーの定義
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  isAction?: boolean;
}

// ソート方向の型
export type SortDirection = 'asc' | 'desc' | null;
