# frozen_string_literal: true

require 'httparty'
require 'dotenv'
require 'uri'
require 'json'

# Auth0ManagementClient class to handle Auth0 Management API operations
class Auth0ManagementClient
  include HTTParty

  # Get access token for Management API
  def self.access_token
    require 'dotenv'
    Dotenv.load

    domain = ENV.fetch('AUTH0_DOMAIN', nil)
    client_id = ENV.fetch('AUTH0_MANAGEMENT_API_CLIENT_ID', nil)
    client_secret = ENV.fetch('AUTH0_MANAGEMENT_API_CLIENT_SECRET', nil)

    raise 'AUTH0_DOMAIN is not set' if domain.nil?
    raise 'AUTH0_MANAGEMENT_API_CLIENT_ID is not set' if client_id.nil?
    raise 'AUTH0_MANAGEMENT_API_CLIENT_SECRET is not set' if client_secret.nil?

    response = HTTParty.post(
      "https://#{domain}/oauth/token",
      body: {
        client_id:,
        client_secret:,
        audience: "https://#{domain}/api/v2/",
        grant_type: 'client_credentials'
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )

    raise "Failed to get access token: #{response.body}" unless response.success?

    JSON.parse(response.body)['access_token']
  end

  # Get list of users
  def self.list_users(params = {})
    token = access_token
    query_params = build_query_params(params)

    response = HTTParty.get(
      "#{management_api_url}/users?#{query_params}",
      headers: { 'Authorization' => "Bearer #{token}" }
    )

    raise "Failed to list users: #{response.body}" unless response.success?

    JSON.parse(response.body)
  end

  # Get a single user by ID
  def self.get_user(user_id)
    token = access_token

    # ユーザーIDをURLエンコード（|などの特殊文字に対応）
    encoded_user_id = URI.encode_www_form_component(user_id)

    response = HTTParty.get(
      "#{management_api_url}/users/#{encoded_user_id}",
      headers: { 'Authorization' => "Bearer #{token}" }
    )

    return nil if response.code == 404
    raise "Failed to get user: #{response.body}" unless response.success?

    JSON.parse(response.body)
  end

  # Get user roles
  # Returns:
  #   Array of role names (e.g., ["admin", "user"])
  #   Empty array if user not found or API call fails
  def self.get_user_roles(user_id)
    token = access_token

    # ユーザーIDをURLエンコード（|などの特殊文字に対応）
    encoded_user_id = URI.encode_www_form_component(user_id)

    begin
      response = HTTParty.get(
        "#{management_api_url}/users/#{encoded_user_id}/roles",
        headers: { 'Authorization' => "Bearer #{token}" }
      )

      if response.success?
        roles = JSON.parse(response.body)
        roles.map { |role| role['name'] }
      else
        Rails.logger.error("Failed to fetch user roles: #{response.code} - #{response.body}") if defined?(Rails)
        []
      end
    # Rescue only network/HTTP/JSON parsing errors to allow configuration errors
    # (like missing AUTH0_DOMAIN) to propagate and fail fast
    rescue HTTParty::Error, Net::OpenTimeout, Net::ReadTimeout, SocketError,
           Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::EHOSTUNREACH,
           JSON::ParserError, Timeout::Error => e
      Rails.logger.error("Error fetching user roles: #{e.message}") if defined?(Rails)
      []
    end
  end

  # Revoke refresh token
  # Auth0のリフレッシュトークンを無効化します
  # Returns:
  #   true - 無効化成功
  #   false - 無効化失敗
  def self.revoke_refresh_token(refresh_token)
    require 'dotenv'
    Dotenv.load

    domain = ENV.fetch('AUTH0_DOMAIN', nil)
    client_id = ENV.fetch('AUTH0_CLIENT_ID', nil) || ENV.fetch('REACT_APP_AUTH0_CLIENT_ID', nil)
    client_secret = ENV.fetch('AUTH0_CLIENT_SECRET', nil)

    raise 'AUTH0_DOMAIN is not set' if domain.nil?
    raise 'AUTH0_CLIENT_ID is not set' if client_id.nil?
    raise 'AUTH0_CLIENT_SECRET is not set' if client_secret.nil?

    # Auth0のToken Revocationエンドポイントを使用
    response = HTTParty.post(
      "https://#{domain}/oauth/revoke",
      body: {
        client_id: client_id,
        client_secret: client_secret,
        token: refresh_token
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )

    if response.success? || response.code == 200
      true
    else
      Rails.logger.error("Failed to revoke refresh token: #{response.code} - #{response.body}") if defined?(Rails)
      false
    end
  rescue StandardError => e
    Rails.logger.error("Error revoking refresh token: #{e.message}") if defined?(Rails)
    false
  end

  # Delete a user
  # Returns:
  #   true - 削除成功
  #   false - 削除失敗（404以外のエラー）
  #   :not_found - ユーザーが見つからない
  def self.delete_user(user_id)
    token = access_token

    # ユーザーIDをURLエンコード（|などの特殊文字に対応）
    encoded_user_id = URI.encode_www_form_component(user_id)

    response = HTTParty.delete(
      "#{management_api_url}/users/#{encoded_user_id}",
      headers: { 'Authorization' => "Bearer #{token}" }
    )

    # 404 Not Found: ユーザーが見つからない
    return :not_found if response.code == 404

    # 204 No Content または 2xx の場合は成功
    # Auth0 Management APIは削除成功時に204を返すことが多い
    # 注: Auth0 Management APIは存在しないユーザーを削除しようとした場合も204を返す場合がある（冪等性）
    return true if response.code == 204
    return true if response.success?

    # その他の失敗の場合はログを出力
    Rails.logger.error "Failed to delete user: #{response.code} - #{response.body}" if defined?(Rails)

    false
  end

  private

  def self.management_api_url
    require 'dotenv'
    Dotenv.load
    domain = ENV.fetch('AUTH0_DOMAIN', nil)
    raise 'AUTH0_DOMAIN is not set' if domain.nil?

    "https://#{domain}/api/v2"
  end

  def self.build_query_params(params)
    query_params = {
      page: params[:page] || 0,
      per_page: params[:per_page] || 50,
      q: params[:q],
      sort: params[:sort],
      include_totals: true
    }

    # orderパラメータはsortと一緒に指定される場合がある
    query_params[:sort] = "#{params[:sort]}:#{params[:order]}" if params[:sort] && params[:order]

    # nil値を除外
    query_params.compact!

    # URI.encode_www_formを使ってクエリ文字列を構築
    query_params.map { |k, v| "#{k}=#{URI.encode_www_form_component(v.to_s)}" }.join('&')
  end
end
