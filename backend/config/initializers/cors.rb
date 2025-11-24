# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 開発環境用のオリジン
    origins_list = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080'
    ]
    
    # 本番環境用のオリジン（環境変数から取得、存在する場合のみ追加）
    frontend_url = ENV['FRONTEND_URL']
    if frontend_url.present?
      # https://プレフィックスがない場合は追加
      unless frontend_url.start_with?('http://', 'https://')
        # .onrender.comドメインがない場合は追加（Render環境の場合）
        if frontend_url.include?('.onrender.com')
          frontend_url = "https://#{frontend_url}"
        else
          frontend_url = "https://#{frontend_url}.onrender.com"
        end
      end
      origins_list << frontend_url
      
      # デバッグ用ログ（本番環境では削除可能）
      Rails.logger.info "CORS: Allowing origin: #{frontend_url}"
    end
    
    origins(*origins_list)

    resource '*',
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
