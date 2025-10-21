require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'PUT /api/v1/routine_tasks/:id', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:category) { create(:category, account_id: user_id, name: '仕事') }
  let(:new_category) { create(:category, account_id: user_id, name: 'プライベート') }
  let!(:routine_task) { create(:routine_task, account_id: user_id, title: 'Original Routine Task', frequency: 'daily', priority: 'medium', category_id: category.id) }
  let(:valid_update_params) do
    {
      routine_task: {
        title: 'Updated Routine Task',
        frequency: 'weekly',
        priority: 'high',
        category_id: new_category.id,
        next_generation_at: 1.week.from_now,
        max_active_tasks: 5
      }
    }
  end

  describe 'PUT /api/v1/routine_tasks/:id' do
    context '正常系' do
      it 'returns a successful response with 200 status' do
        put "/api/v1/routine_tasks/#{routine_task.id}", params: valid_update_params, headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it 'updates the routine_task with new values' do
        put "/api/v1/routine_tasks/#{routine_task.id}", params: valid_update_params, headers: auth_headers

        routine_task.reload
        expect(routine_task.title).to eq('Updated Routine Task')
        expect(routine_task.frequency).to eq('weekly')
        expect(routine_task.priority).to eq('high')
        expect(routine_task.category_id).to eq(new_category.id)
        expect(routine_task.max_active_tasks).to eq(5)
      end

      it 'returns success message' do
        put "/api/v1/routine_tasks/#{routine_task.id}", params: valid_update_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'message' => '習慣化タスクが正常に更新されました'
        )
      end

      it 'updates only specified fields' do
        partial_params = { routine_task: { title: 'Partially Updated Routine Task' } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: partial_params, headers: auth_headers

        routine_task.reload
        expect(routine_task.title).to eq('Partially Updated Routine Task')
        expect(routine_task.frequency).to eq('daily') # 元のまま
        expect(routine_task.priority).to eq('medium') # 元のまま
      end

      it 'handles nil values correctly' do
        nil_params = { routine_task: { priority: nil, category_id: nil } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: nil_params, headers: auth_headers

        routine_task.reload
        expect(routine_task.priority).to be_nil
        expect(routine_task.category_id).to be_nil
      end
    end

    context '異常系' do
      context '習慣化タスクが存在しない場合' do
        it 'returns 404 when routine_task does not exist' do
          put '/api/v1/routine_tasks/99999', params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end
      end

      context '他のユーザーの習慣化タスクを更新しようとした場合' do
        let!(:other_user_routine_task) { create(:routine_task, account_id: 'other-user', title: 'Other User Routine Task', frequency: 'daily') }

        it 'returns 404 when trying to update another users routine_task' do
          put "/api/v1/routine_tasks/#{other_user_routine_task.id}", params: valid_update_params, headers: auth_headers
          expect(response).to have_http_status(:not_found)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('習慣化タスクが見つかりません')
        end

        it 'does not update the other users routine_task' do
          original_title = other_user_routine_task.title
          put "/api/v1/routine_tasks/#{other_user_routine_task.id}", params: valid_update_params, headers: auth_headers

          other_user_routine_task.reload
          expect(other_user_routine_task.title).to eq(original_title)
        end
      end

      context 'バリデーションエラー' do
        it 'returns 422 when title is blank' do
          invalid_params = { routine_task: { title: '' } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title は必須です')
        end

        it 'returns 422 when title is too long' do
          long_title_params = { routine_task: { title: 'a' * 256 } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: long_title_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Title は255文字以内で入力してください')
        end

        it 'does not update routine_task when validation fails' do
          original_title = routine_task.title
          invalid_params = { routine_task: { title: '' } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: invalid_params, headers: auth_headers

          routine_task.reload
          expect(routine_task.title).to eq(original_title)
        end

        it 'returns 422 when frequency is invalid' do
          invalid_params = { routine_task: { frequency: 'invalid_frequency' } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
        end

        it 'returns 422 when changing to custom without interval_value' do
          invalid_params = { routine_task: { frequency: 'custom', interval_value: nil } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to include('Interval value はカスタム頻度の場合必須です')
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          put "/api/v1/routine_tasks/#{routine_task.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          put "/api/v1/routine_tasks/#{routine_task.id}", params: valid_update_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のタイトルで正常に更新される' do
        max_title_params = { routine_task: { title: 'a' * 255 } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: max_title_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        routine_task.reload
        expect(routine_task.title).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に更新される' do
        special_params = { routine_task: { title: 'Updated 習慣タスク (重要) - 毎日実行が必要です！' } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: special_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        routine_task.reload
        expect(routine_task.title).to eq('Updated 習慣タスク (重要) - 毎日実行が必要です！')
      end

      it 'category_idがnilでも正常に更新される' do
        no_category_params = { routine_task: { category_id: nil } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: no_category_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        routine_task.reload
        expect(routine_task.category_id).to be_nil
      end

      it 'priorityがnilでも正常に更新される' do
        no_priority_params = { routine_task: { priority: nil } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: no_priority_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        routine_task.reload
        expect(routine_task.priority).to be_nil
      end

      it '各frequency値で正常に更新される' do
        %w[daily weekly monthly].each do |frequency|
          params = { routine_task: { frequency: frequency } }

          put "/api/v1/routine_tasks/#{routine_task.id}", params: params, headers: auth_headers
          expect(response).to have_http_status(:ok)

          routine_task.reload
          expect(routine_task.frequency).to eq(frequency)
          expect(routine_task.interval_value).to be_nil # daily/weekly/monthlyはNULL
        end
      end

      it 'customに変更する場合interval_valueを設定できる' do
        custom_params = { routine_task: { frequency: 'custom', interval_value: 7 } }

        put "/api/v1/routine_tasks/#{routine_task.id}", params: custom_params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        routine_task.reload
        expect(routine_task.frequency).to eq('custom')
        expect(routine_task.interval_value).to eq(7)
      end

      it 'customからdailyに変更する場合interval_valueはそのまま残る' do
        # まずcustomに設定
        custom_routine_task = create(:routine_task, :custom, account_id: user_id, interval_value: 5)

        # dailyに変更
        params = { routine_task: { frequency: 'daily' } }
        put "/api/v1/routine_tasks/#{custom_routine_task.id}", params: params, headers: auth_headers
        expect(response).to have_http_status(:ok)

        custom_routine_task.reload
        expect(custom_routine_task.frequency).to eq('daily')
        # interval_valueは更新されないのでそのまま（バリデーションはdaily/weekly/monthlyでは無視される）
        expect(custom_routine_task.interval_value).to eq(5)
      end
    end
  end
end
