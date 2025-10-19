# モデル層（Model Layer）

## 概要

モデル層は、データベースとのやり取りとビジネスロジックの中核を担う層です。ActiveRecordを活用して、データの永続化、バリデーション、関連性の管理を行います。

## 責任範囲

### ✅ **モデル層が担当すべき処理**

1. **データベース操作**
   - レコードの作成、読み取り、更新、削除（CRUD）
   - データベースクエリの最適化
   - トランザクション管理

2. **データバリデーション**
   - 属性の存在チェック
   - データ形式の検証
   - ビジネスルールの検証

3. **関連性の管理**
   - アソシエーションの定義
   - 依存関係の管理
   - データ整合性の保証

4. **スコープとクエリ**
   - よく使用されるクエリの抽象化
   - フィルタリング機能
   - ソート機能

5. **ビジネスロジック**
   - ドメイン固有の計算
   - 状態の管理
   - データ変換

### ❌ **モデル層が担当すべきでない処理**

1. **HTTPリクエストの処理**
2. **レスポンスの生成**
3. **認証・認可**
4. **外部API連携**
5. **複雑なビジネスロジック（複数モデル跨ぎ）**

## 実装例

### 基本的なモデル構造

```ruby
class Task < ApplicationRecord
  include AccountScoped

  # アソシエーション
  belongs_to :category, optional: true

  # バリデーション
  validates :title, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[未着手 進行中 完了 保留] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :due_date, future_date: true, allow_nil: true

  # スコープ
  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }

  # クラスメソッド
  def self.for_user(user_id)
    by_account(user_id)
  end

  def self.search(query)
    where('title ILIKE ?', "%#{query}%")
  end

  # インスタンスメソッド
  def overdue?
    due_date.present? && due_date < Time.current
  end

  def completed?
    status == '完了'
  end

  def in_progress?
    status == '進行中'
  end

  def pending?
    status == '未着手'
  end

  private

  def set_default_status
    self.status ||= '未着手'
  end
end
```

### カスタムバリデーター

```ruby
class FutureDateValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.nil? # allow_nil: true と併用

    if value.present? && value < Time.current
      record.errors.add(attribute, (options[:message] || I18n.t('errors.messages.future_date')))
    end
  end
end
```

### コンサーン（共通機能）

```ruby
module AccountScoped
  extend ActiveSupport::Concern

  included do
    scope :by_account, ->(account_id) { where(account_id: account_id) }

    def self.for_user(user_id)
      by_account(user_id)
    end
  end
end
```

## 設計原則

### 1. **単一責任の原則（SRP）**
- 各モデルは一つのドメイン概念を表現
- 関連するデータとロジックを一箇所に集約

### 2. **DRY（Don't Repeat Yourself）**
- 共通の機能はコンサーンに抽出
- 重複するバリデーションやスコープを避ける

### 3. **命名規則**
- モデル名は単数形（Task, Category）
- テーブル名は複数形（tasks, categories）
- アソシエーション名は直感的に

### 4. **パフォーマンス考慮**
- 必要なデータのみを取得（select）
- N+1問題の回避（includes, preload）
- 適切なインデックスの設定

## テスト

### モデルテストの例

```ruby
RSpec.describe Task, type: :model do
  describe 'バリデーション' do
    it 'タイトルが必須であること' do
      task = build(:task, title: '')
      expect(task).to be_invalid
      expect(task.errors[:title]).to include('タイトルは必須です')
    end

    it 'ステータスが有効な値であること' do
      task = build(:task, status: '無効なステータス')
      expect(task).to be_invalid
      expect(task.errors[:status]).to include('は一覧にありません')
    end
  end

  describe 'スコープ' do
    it '期限切れタスクを取得できること' do
      overdue_task = create(:task, due_date: 1.day.ago)
      current_task = create(:task, due_date: 1.day.from_now)

      expect(Task.overdue).to include(overdue_task)
      expect(Task.overdue).not_to include(current_task)
    end
  end

  describe 'インスタンスメソッド' do
    it '期限切れかどうかを判定できること' do
      overdue_task = build(:task, due_date: 1.day.ago)
      current_task = build(:task, due_date: 1.day.from_now)

      expect(overdue_task.overdue?).to be true
      expect(current_task.overdue?).to be false
    end
  end
end
```

## ベストプラクティス

1. **適切なバリデーション**
   - データベースレベルとアプリケーションレベルの両方で検証
   - カスタムバリデーターの活用

2. **スコープの活用**
   - よく使用されるクエリをスコープとして定義
   - チェーン可能なスコープの設計

3. **アソシエーションの最適化**
   - 必要な関連データのみを読み込み
   - 依存関係の適切な管理

4. **パフォーマンスの考慮**
   - インデックスの適切な設定
   - クエリの最適化
   - キャッシュの活用

5. **国際化対応**
   - エラーメッセージの国際化
   - 日付・時刻の適切な処理
