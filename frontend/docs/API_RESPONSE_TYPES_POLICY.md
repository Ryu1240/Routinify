# APIレスポンス型の配置方針

**関連Issue**: #294

## 現状

- **グローバル型**: `types/` に集約（Task, Category, RoutineTask, Milestone 等のドメイン型、ApiResponse, ApiError 等の共通型）
- **APIレスポンス型**: 各 feature の `*Api.ts` 内で個別に定義
  - `tasksApi.ts`: `TaskResponse`, `TaskRequestBody`
  - `routineTasksApi.ts`: `RoutineTaskResponse`, `SingleRoutineTaskResponse`, `GenerateResponse` 等
  - `milestonesApi.ts`: `MilestoneResponse`, `MilestoneDetailResponse` 等
  - `categoriesApi.ts`: `CategoryResponse`
  - `authApi.ts`: `LoginResponse`, `UserResponse`（export 済み）
  - `achievementsApi.ts`: `AchievementStatsApiResponse` 等

## 方針の選択肢

### 選択肢A: types/ に集約する

APIレスポンス型を `types/`（例: `types/apiResponses.ts`）に一元管理する。

**メリット**

- レスポンス型の定義箇所が一箇所にまとまる
- 複数 feature で同じレスポンス形式を使う場合に型の再利用が容易

**デメリット**

- types が肥大化しやすく、API 変更時に types と api の両方を確認する必要がある
- レスポンス型の多くは特定の API エンドポイントに紐づいており、他の場所から参照されない

### 選択肢B: 各 feature の api に閉じる（採用）

APIレスポンス型は各 feature の `*Api.ts` 内で定義し、その feature 内に閉じる。

**メリット**

- カプセル化が高く、API の変更はその feature 内だけで完結する
- feature の独立性が保たれる
- レスポンス型が API 実装の近くにあり、可読性・保守性がよい

**デメリット**

- 同じような型が複数の api に分散する（`ApiResponse<T>` の活用で軽減可能）

## 採用方針: 選択肢B（各 feature の api に閉じる）

### ルール

1. **共通形式のレスポンス**: `types/api.ts` の `ApiResponse<T>` を利用する

   ```typescript
   // ✅ 良い例
   const response = await axios.get<ApiResponse<Task[]>>('/api/v1/tasks');
   return response.data.data;
   ```

2. **API 固有のレスポンス型**: 各 `*Api.ts` 内で `type` として定義する

   - 他 feature から参照されない限り、そのファイル内に閉じる
   - `{ success: boolean; data: T }` のように `ApiResponse` と形式が異なる場合も同様

   ```typescript
   // features/milestones/api/milestonesApi.ts
   type MilestoneDetailResponse = {
     success: boolean;
     data: Milestone;
   };
   ```

3. **他 feature から参照される型**: 必要に応じて export する

   - 例: `LoginResponse`, `UserResponse`（認証コンテキスト等で使用）
   - 配置: その feature の `api/index.ts` から export、または `types/` に追加

4. **リクエストボディ型**: 各 `*Api.ts` 内で定義（レスポンス型と同様）

### 既存コードとの整合

現状の `*Api.ts` でのローカル定義は、この方針に沿っている。
変更時は、可能な範囲で `ApiResponse<T>` への統一を検討する。

---

## 関連ドキュメント

- [型定義層（LAYER_TYPES.md）](LAYER_TYPES.md)
- [アーキテクチャガイド](../ARCHITECTURE_GUIDE.md)
