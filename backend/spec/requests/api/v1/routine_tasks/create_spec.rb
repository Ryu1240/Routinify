require 'rails_helper'
require_relative 'shared_context'

RSpec.describe 'POST /api/v1/routine_tasks', type: :request do
  include_context 'routine_tasks request spec setup'

  let(:category) { create(:category, account_id: user_id) }
  let(:valid_params) do
    {
      routine_task: {
        title: 'New Routine Task',
        frequency: 'daily',
        next_generation_at: 1.day.from_now,
        max_active_tasks: 3,
        priority: 'high',
        category_id: category.id,
        is_active: true
      }
    }
  end

  describe 'POST /api/v1/routine_tasks' do
    context '正常系' do
      it 'returns a successful response with 201 status' do
        post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it 'creates a new routine_task' do
        expect do
          post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers
        end.to change(RoutineTask, :count).by(1)
      end

      it 'returns success message' do
        post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers
        json_response = JSON.parse(response.body)

        expect(json_response).to include(
          'success' => true,
          'message' => '習慣化タスクが正常に作成されました'
        )
      end

      it 'automatically sets account_id to current user' do
        post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers
        created_routine_task = RoutineTask.last
        expect(created_routine_task.account_id).to eq(user_id)
      end

      it 'creates routine_task with minimal required params' do
        minimal_params = {
          routine_task: {
            title: 'Minimal Routine Task',
            frequency: 'daily',
            next_generation_at: 1.day.from_now
          }
        }

        post '/api/v1/routine_tasks', params: minimal_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

        created_routine_task = RoutineTask.last
        expect(created_routine_task.title).to eq('Minimal Routine Task')
        expect(created_routine_task.account_id).to eq(user_id)
        expect(created_routine_task.interval_value).to be_nil # daily/weekly/monthlyはNULL
        expect(created_routine_task.max_active_tasks).to eq(3) # デフォルト値
        expect(created_routine_task.is_active).to be true # デフォルト値
      end

      it 'handles various frequency values correctly' do
        %w[daily weekly monthly].each do |frequency|
          params = valid_params.dup
          params[:routine_task][:frequency] = frequency

          post '/api/v1/routine_tasks', params: params, headers: auth_headers
          expect(response).to have_http_status(:created)

          json_response = JSON.parse(response.body)
          expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

          created_routine_task = RoutineTask.last
          expect(created_routine_task.frequency).to eq(frequency)
          expect(created_routine_task.interval_value).to be_nil
        end

        # customは別途interval_valueが必要
        custom_params = valid_params.dup
        custom_params[:routine_task][:frequency] = 'custom'
        custom_params[:routine_task][:interval_value] = 3

        post '/api/v1/routine_tasks', params: custom_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        created_routine_task = RoutineTask.last
        expect(created_routine_task.frequency).to eq('custom')
        expect(created_routine_task.interval_value).to eq(3)
      end

      it 'creates with default values when not specified' do
        params_without_defaults = {
          routine_task: {
            title: 'Task with defaults',
            frequency: 'weekly',
            next_generation_at: 1.week.from_now
          }
        }

        post '/api/v1/routine_tasks', params: params_without_defaults, headers: auth_headers
        expect(response).to have_http_status(:created)

        created_routine_task = RoutineTask.last
        expect(created_routine_task.interval_value).to be_nil # weeklyなのでNULL
        expect(created_routine_task.max_active_tasks).to eq(3)
        expect(created_routine_task.is_active).to be true
      end

      it 'custom frequencyではinterval_valueが必須' do
        custom_without_interval = {
          routine_task: {
            title: 'Custom without interval',
            frequency: 'custom',
            next_generation_at: 3.days.from_now
          }
        }

        post '/api/v1/routine_tasks', params: custom_without_interval, headers: auth_headers
        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be false
        expect(json_response['errors']).to include('Interval value はカスタム頻度の場合必須です')
      end
    end

    context '異常系' do
      context 'バリデーションエラー' do
        it 'returns 422 when title is missing' do
          invalid_params = {
            routine_task: {
              frequency: 'daily',
              next_generation_at: 1.day.from_now
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Title は必須です')
        end

        it 'returns 422 when title is too long' do
          long_title_params = {
            routine_task: {
              title: 'a' * 256,
              frequency: 'daily',
              next_generation_at: 1.day.from_now
            }
          }

          post '/api/v1/routine_tasks', params: long_title_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to include('Title は255文字以内で入力してください')
        end

        it 'returns 422 when frequency is missing' do
          invalid_params = {
            routine_task: {
              title: 'Test Task',
              next_generation_at: 1.day.from_now
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
          expect(json_response['errors']).to be_an(Array)
        end

        it 'returns 422 when frequency is invalid' do
          invalid_params = {
            routine_task: {
              title: 'Test Task',
              frequency: 'invalid_frequency',
              next_generation_at: 1.day.from_now
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
        end

        it 'returns 422 when next_generation_at is missing' do
          invalid_params = {
            routine_task: {
              title: 'Test Task',
              frequency: 'daily'
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
        end

        it 'returns 422 when interval_value is 0 or negative' do
          invalid_params = {
            routine_task: {
              title: 'Test Task',
              frequency: 'custom',
              interval_value: 0,
              next_generation_at: 1.day.from_now
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
        end

        it 'returns 422 when priority is invalid' do
          invalid_params = {
            routine_task: {
              title: 'Test Task',
              frequency: 'daily',
              next_generation_at: 1.day.from_now,
              priority: 'invalid_priority'
            }
          }

          post '/api/v1/routine_tasks', params: invalid_params, headers: auth_headers
          expect(response).to have_http_status(:unprocessable_entity)

          json_response = JSON.parse(response.body)
          expect(json_response['success']).to be false
        end
      end

      context '認証関連' do
        it '認証が失敗した場合、適切なエラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:authorize) do |controller|
            controller.render json: { message: 'Invalid token' }, status: :unauthorized
          end

          post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:unauthorized)
          expect(JSON.parse(response.body)['message']).to eq('Invalid token')
        end
      end

      context '権限関連' do
        it '権限が不足している場合、403エラーを返すこと' do
          allow_any_instance_of(ApplicationController).to receive(:validate_permissions) do |controller|
            controller.render json: { message: 'Permission denied' }, status: :forbidden
          end

          post '/api/v1/routine_tasks', params: valid_params, headers: auth_headers

          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['message']).to eq('Permission denied')
        end
      end
    end

    context 'エッジケース' do
      it '最大長のタイトルで正常に作成される' do
        max_title_params = {
          routine_task: {
            title: 'a' * 255,
            frequency: 'daily',
            next_generation_at: 1.day.from_now
          }
        }

        post '/api/v1/routine_tasks', params: max_title_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

        created_routine_task = RoutineTask.last
        expect(created_routine_task.title).to eq('a' * 255)
      end

      it '特殊文字を含むタイトルで正常に作成される' do
        special_params = {
          routine_task: {
            title: '習慣タスク (重要) - 毎日実行が必要です！',
            frequency: 'daily',
            next_generation_at: 1.day.from_now
          }
        }

        post '/api/v1/routine_tasks', params: special_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

        created_routine_task = RoutineTask.last
        expect(created_routine_task.title).to eq('習慣タスク (重要) - 毎日実行が必要です！')
      end

      it 'category_idがnilでも正常に作成される' do
        no_category_params = {
          routine_task: {
            title: 'No category task',
            frequency: 'weekly',
            next_generation_at: 1.week.from_now,
            category_id: nil
          }
        }

        post '/api/v1/routine_tasks', params: no_category_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

        created_routine_task = RoutineTask.last
        expect(created_routine_task.category_id).to be_nil
      end

      it 'priorityがnilでも正常に作成される' do
        no_priority_params = {
          routine_task: {
            title: 'No priority task',
            frequency: 'monthly',
            next_generation_at: 1.month.from_now,
            priority: nil
          }
        }

        post '/api/v1/routine_tasks', params: no_priority_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true
        expect(json_response['message']).to eq('習慣化タスクが正常に作成されました')

        created_routine_task = RoutineTask.last
        expect(created_routine_task.priority).to be_nil
      end

      it 'custom頻度でinterval_valueが正しく機能する' do
        custom_params = {
          routine_task: {
            title: 'Custom frequency task',
            frequency: 'custom',
            interval_value: 5,
            next_generation_at: 5.days.from_now
          }
        }

        post '/api/v1/routine_tasks', params: custom_params, headers: auth_headers
        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response['success']).to be true

        created_routine_task = RoutineTask.last
        expect(created_routine_task.frequency).to eq('custom')
        expect(created_routine_task.interval_value).to eq(5)
      end
    end
  end
end
