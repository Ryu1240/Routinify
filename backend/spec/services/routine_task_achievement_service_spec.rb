require 'rails_helper'

RSpec.describe RoutineTaskAchievementService, type: :service do
  let(:account_id) { 'user-1' }
  let(:routine_task) { create(:routine_task, account_id: account_id) }

  describe '#call' do
    context '無効なperiodが指定された場合' do
      it 'エラーを返すこと' do
        service = RoutineTaskAchievementService.new(routine_task, period: 'invalid')
        result = service.call
        expect(result.error?).to be true
        expect(result.errors.any? { |e| e.match?(/period must be one of/) }).to be true
      end
    end

    context 'custom期間でstart_dateとend_dateが指定されていない場合' do
      it 'エラーを返すこと' do
        service = RoutineTaskAchievementService.new(routine_task, period: 'custom')
        result = service.call
        expect(result.error?).to be true
        expect(result.errors.any? { |e| e.match?(/start_date and end_date are required/) }).to be true
      end
    end

    describe '週次の達成率計算' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }
      let(:week_start) { Date.current.beginning_of_week }
      let(:week_end) { Date.current.end_of_week }

      context 'すべてのタスクが完了した場合' do
        before do
          create_list(:task, 3,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: week_start + 1.day,
                     status: 'completed')
        end

        it '達成率が100%になること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(3)
          expect(data[:completed_count]).to eq(3)
          expect(data[:achievement_rate]).to eq(100.0)
        end
      end

      context '一部のタスクが完了した場合' do
        before do
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 1.day, status: 'completed')
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 2.days, status: 'pending')
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 3.days, status: 'in_progress')
        end

        it '正しい達成率を計算すること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(3)
          expect(data[:completed_count]).to eq(1)
          expect(data[:achievement_rate]).to eq(33.33)
          expect(data[:incomplete_count]).to eq(2)
        end
      end

      context 'タスクが1つも生成されていない場合' do
        it '達成率が0%になること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(0)
          expect(data[:completed_count]).to eq(0)
          expect(data[:achievement_rate]).to eq(0.0)
        end
      end

      context '期間外のタスクが存在する場合' do
        before do
          # 期間内のタスク
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 1.day, status: 'completed')
          # 期間外のタスク（前週）
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start - 1.day, status: 'completed')
          # 期間外のタスク（次週）
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_end + 1.day, status: 'completed')
        end

        it '期間内のタスクのみを集計すること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(1)
          expect(data[:completed_count]).to eq(1)
        end
      end
    end

    describe '月次の達成率計算' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'monthly') }
      let(:month_start) { Date.current.beginning_of_month }
      let(:month_end) { Date.current.end_of_month }

      context 'すべてのタスクが完了した場合' do
        before do
          create_list(:task, 5,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: month_start + 5.days,
                     status: 'completed')
        end

        it '達成率が100%になること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(5)
          expect(data[:completed_count]).to eq(5)
          expect(data[:achievement_rate]).to eq(100.0)
        end
      end

      context '一部のタスクが完了した場合' do
        before do
          create_list(:task, 3,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: month_start + 1.day,
                     status: 'completed')
          create_list(:task, 2,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: month_start + 2.days,
                     status: 'pending')
        end

        it '正しい達成率を計算すること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(5)
          expect(data[:completed_count]).to eq(3)
          expect(data[:achievement_rate]).to eq(60.0)
        end
      end
    end

    describe '特定期間の達成率計算' do
      let(:start_date) { 2.weeks.ago.to_date }
      let(:end_date) { 1.week.ago.to_date }
      let(:service) do
        RoutineTaskAchievementService.new(
          routine_task,
          period: 'custom',
          start_date: start_date,
          end_date: end_date
        )
      end

      context '期間内のタスクが存在する場合' do
        before do
          create_list(:task, 4,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: start_date + 3.days,
                     status: 'completed')
          create_list(:task, 2,
                     account_id: account_id,
                     routine_task: routine_task,
                     generated_at: start_date + 5.days,
                     status: 'pending')
        end

        it '正しい達成率を計算すること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(6)
          expect(data[:completed_count]).to eq(4)
          expect(data[:achievement_rate]).to eq(66.67)
          expect(data[:start_date]).to eq(start_date)
          expect(data[:end_date]).to eq(end_date)
        end
      end
    end

    describe '削除されたタスクも集計対象に含まれること' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }
      let(:week_start) { Date.current.beginning_of_week }

      before do
        task1 = create(:task, account_id: account_id, routine_task: routine_task,
                      generated_at: week_start + 1.day, status: 'completed')
        task2 = create(:task, account_id: account_id, routine_task: routine_task,
                      generated_at: week_start + 2.days, status: 'completed')
        # タスクを削除
        task2.update_column(:deleted_at, Time.current)
      end

      it '削除されたタスクも総タスク数に含まれること' do
        result = service.call
        expect(result.success?).to be true
        data = result.data
        expect(data[:total_count]).to eq(2)
        expect(data[:completed_count]).to eq(2)
        expect(data[:achievement_rate]).to eq(100.0)
      end
    end

    describe '期限超過タスク数の計算' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }
      let(:week_start) { Date.current.beginning_of_week }

      before do
        create(:task, account_id: account_id, routine_task: routine_task,
               generated_at: week_start + 1.day, status: 'pending',
               due_date: Date.current - 1.day) # 期限超過
        create(:task, account_id: account_id, routine_task: routine_task,
               generated_at: week_start + 2.days, status: 'completed',
               due_date: Date.current + 1.day) # 期限前
      end

      it '期限超過タスク数を正しく計算すること' do
        result = service.call
        expect(result.success?).to be true
        data = result.data
        expect(data[:overdue_count]).to eq(1)
      end
    end

    describe '連続達成週数/月数の計算' do
      context '週次の連続達成週数の計算' do
        let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }
        let(:current_week_start) { Date.current.beginning_of_week }
        let(:last_week_start) { (Date.current - 1.week).beginning_of_week }
        let(:two_weeks_ago_start) { (Date.current - 2.weeks).beginning_of_week }

        context '3週連続で達成率100%の場合' do
          before do
            # 現在の週: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: current_week_start + 1.day, status: 'completed')
            # 1週間前: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: last_week_start + 1.day, status: 'completed')
            # 2週間前: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: two_weeks_ago_start + 1.day, status: 'completed')
          end

          it '連続達成週数が3になること' do
            result = service.call
            expect(result.success?).to be true
            data = result.data
            expect(data[:consecutive_periods_count]).to eq(3)
          end
        end

        context '途中で未達成の週がある場合' do
          before do
            # 現在の週: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: current_week_start + 1.day, status: 'completed')
            # 1週間前: 一部未完了（達成率50%）
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: last_week_start + 1.day, status: 'completed')
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: last_week_start + 2.days, status: 'pending')
            # 2週間前: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: two_weeks_ago_start + 1.day, status: 'completed')
          end

          it '連続達成週数が1になること（最新の週のみ達成）' do
            result = service.call
            expect(result.success?).to be true
            data = result.data
            expect(data[:consecutive_periods_count]).to eq(1)
          end
        end

        context 'タスクが1つも生成されていない週がある場合' do
          before do
            # 現在の週: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: current_week_start + 1.day, status: 'completed')
            # 1週間前: タスクなし（連続が途切れる）
            # 2週間前: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: two_weeks_ago_start + 1.day, status: 'completed')
          end

          it '連続達成週数が1になること' do
            result = service.call
            expect(result.success?).to be true
            data = result.data
            expect(data[:consecutive_periods_count]).to eq(1)
          end
        end

        context '達成率が100%未満の週がある場合' do
          before do
            # 現在の週: 達成率99%（未達成）
            create_list(:task, 99,
                        account_id: account_id,
                        routine_task: routine_task,
                        generated_at: current_week_start + 1.day,
                        status: 'completed')
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: current_week_start + 2.days, status: 'pending')
          end

          it '連続達成週数が0になること' do
            result = service.call
            expect(result.success?).to be true
            data = result.data
            expect(data[:consecutive_periods_count]).to eq(0)
          end
        end
      end

      context '月次の連続達成月数の計算' do
        let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'monthly') }
        let(:current_month_start) { Date.current.beginning_of_month }
        let(:last_month_start) { (Date.current - 1.month).beginning_of_month }
        let(:two_months_ago_start) { (Date.current - 2.months).beginning_of_month }

        context '2ヶ月連続で達成率100%の場合' do
          before do
            # 今月: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: current_month_start + 5.days, status: 'completed')
            # 先月: すべて完了
            create(:task, account_id: account_id, routine_task: routine_task,
                   generated_at: last_month_start + 5.days, status: 'completed')
          end

          it '連続達成月数が2になること' do
            result = service.call
            expect(result.success?).to be true
            data = result.data
            expect(data[:consecutive_periods_count]).to eq(2)
          end
        end
      end

      context 'カスタム期間の場合' do
        let(:start_date) { 2.weeks.ago.to_date }
        let(:end_date) { 1.week.ago.to_date }
        let(:service) do
          RoutineTaskAchievementService.new(
            routine_task,
            period: 'custom',
            start_date: start_date,
            end_date: end_date
          )
        end

        it '連続達成期間数が0になること（カスタム期間では連続達成は意味がない）' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:consecutive_periods_count]).to eq(0)
        end
      end
    end

    describe '平均完了日数の計算' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }
      let(:week_start) { Date.current.beginning_of_week }

      context '完了したタスクが存在する場合' do
        before do
          # generated_atから2日後に完了
          task1 = create(:task, account_id: account_id, routine_task: routine_task,
                        generated_at: week_start + 1.day, status: 'completed')
          task1.update_column(:updated_at, task1.generated_at + 2.days)

          # generated_atから3日後に完了
          task2 = create(:task, account_id: account_id, routine_task: routine_task,
                        generated_at: week_start + 2.days, status: 'completed')
          task2.update_column(:updated_at, task2.generated_at + 3.days)
        end

        it '平均完了日数を正しく計算すること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:average_completion_days]).to eq(2.5)
        end
      end

      context '完了したタスクが存在しない場合' do
        before do
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 1.day, status: 'pending')
        end

        it '平均完了日数が0になること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:average_completion_days]).to eq(0.0)
        end
      end
    end

    describe 'エッジケース' do
      let(:service) { RoutineTaskAchievementService.new(routine_task, period: 'weekly') }

      context '期間内にタスクが存在しない場合' do
        it 'すべての値が0または適切なデフォルト値になること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:total_count]).to eq(0)
          expect(data[:completed_count]).to eq(0)
          expect(data[:incomplete_count]).to eq(0)
          expect(data[:overdue_count]).to eq(0)
          expect(data[:achievement_rate]).to eq(0.0)
          expect(data[:consecutive_periods_count]).to eq(0)
          expect(data[:average_completion_days]).to eq(0.0)
        end
      end

      context 'on_holdステータスのタスクが存在する場合' do
        let(:week_start) { Date.current.beginning_of_week }

        before do
          create(:task, account_id: account_id, routine_task: routine_task,
                 generated_at: week_start + 1.day, status: 'on_hold')
        end

        it '未完了タスク数に含まれること' do
          result = service.call
          expect(result.success?).to be true
          data = result.data
          expect(data[:incomplete_count]).to eq(1)
        end
      end
    end
  end
end
