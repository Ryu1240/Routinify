namespace :db do
  namespace :seed do
    desc '既存のシードデータを削除してからシードを実行（開発環境・テスト環境のみ）'
    task reset: :environment do
      if Rails.env.production? || Rails.env.test?
        puts 'エラー: 本番環境ではこのタスクを実行できません。'
        exit 1
      end

      puts '========================================'
      puts '既存のシードデータを削除しています...'
      puts '========================================'

      test_user_id = 'google-oauth2|114430600905307477148'

      # 関連データを削除（外部キー制約があるため順序が重要）
      Task.where(account_id: test_user_id).destroy_all
      puts '  - Tasks deleted'

      RoutineTask.where(account_id: test_user_id).destroy_all
      puts '  - RoutineTasks deleted'

      Category.where(account_id: test_user_id).destroy_all
      puts '  - Categories deleted'

      puts '既存データの削除が完了しました！'
      puts '========================================'
      puts ''

      # シードを実行
      puts 'シードデータを投入しています...'
      puts ''
      Rake::Task['db:seed'].invoke
    end

    desc 'シードデータをクリーンアップ（削除のみ）'
    task cleanup: :environment do
      if Rails.env.production? || Rails.env.test?
        puts 'エラー: 本番環境ではこのタスクを実行できません。'
        exit 1
      end

      puts '========================================'
      puts 'シードデータを削除しています...'
      puts '========================================'

      test_user_id = 'google-oauth2|114430600905307477148'

      # 関連データを削除（外部キー制約があるため順序が重要）
      Task.where(account_id: test_user_id).destroy_all
      puts '  - Tasks deleted'

      RoutineTask.where(account_id: test_user_id).destroy_all
      puts '  - RoutineTasks deleted'

      Category.where(account_id: test_user_id).destroy_all
      puts '  - Categories deleted'

      puts 'シードデータの削除が完了しました！'
      puts '========================================'
    end

    desc 'バッチタスク生成テスト用の大量データを作成'
    task batch_generation: :environment do
      if Rails.env.production?
        puts 'エラー: 本番環境ではこのタスクを実行できません。'
        exit 1
      end

      load Rails.root.join('db', 'seeds_batch_generation.rb')
    end
  end
end
