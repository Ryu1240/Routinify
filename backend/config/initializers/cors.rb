# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 開発環境用のオリジン
    origins(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      # 本番環境用のオリジン（環境変数から取得）
      ENV['FRONTEND_URL']
    ).compact

    resource '*',
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
