# データ取得戦略

**関連Issue**: #296

## 現状

React Query（TanStack Query）は未使用。データ取得は次の方式で行われている。

### 取得パターン

- **画面ごとの fetch**: 各 feature の `useFetch*` 系フック（`useFetchTasks`, `useFetchMilestones` 等）で個別に API 呼び出し
- **再取得**: `refreshTasks`, `refetchMilestones` 等のコールバックを props で渡し、必要時に再実行
- **グローバルな再取得**: `tasks-refresh` の CustomEvent で他画面に再取得を通知

### ローディング・エラー状態

- 各フックが `loading`, `error` を個別に管理
- 共通化されたパターンは一部に限られる

### 問題点

- キャッシュの共通化がされていない
- 再取得ロジックが画面・フックごとにばらついている
- ローディング・エラー処理が重複しやすい

## 改善案: React Query（TanStack Query）の導入検討

キャッシュ・再取得・ローディング状態の共通化が必要になった場合、**React Query（TanStack Query）** の導入を検討する。

### 検討する状況の例

- 複数画面で同じデータを共有したい
- バックグラウンドでの自動再取得（stale-while-revalidate）がほしい
- ローディング・エラー・リトライの扱いを統一したい
- 楽観的更新（Optimistic Update）を安定して実装したい

### 優先度

他機能の改善・リファクタを優先し、上記のようなニーズが明確になった段階で導入を検討する。

### 導入時の参考

- `useQuery` によるフェッチとキャッシュ
- `useMutation` による更新と `invalidateQueries` でのキャッシュ無効化
- `tasks-refresh` イベントに代わる Query Client の `invalidateQueries` の利用

---

## 関連ドキュメント

- [カスタムフック層（LAYER_HOOKS.md）](LAYER_HOOKS.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
