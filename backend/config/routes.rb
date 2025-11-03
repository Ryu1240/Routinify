Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # 認証エンドポイント
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      get 'auth/me', to: 'auth#me'

      resources :tasks, only: [ :index, :show, :create, :update, :destroy ]
      resources :categories, only: [ :index, :create, :update, :destroy ]
      resources :routine_tasks, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :generate
          get :generation_status
          get :achievement_stats
          get :achievement_trend
        end
      end
      resources :milestones, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :tasks, to: 'milestones#associate_task'
          delete :tasks, to: 'milestones#dissociate_task'
        end
      end

      namespace :admin do
        resources :users, only: [ :index, :destroy ]
      end
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get 'up' => 'rails/health#show', as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
