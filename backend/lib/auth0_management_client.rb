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

  # Delete a user
  def self.delete_user(user_id)
    token = access_token

    response = HTTParty.delete(
      "#{management_api_url}/users/#{user_id}",
      headers: { 'Authorization' => "Bearer #{token}" }
    )

    response.success?
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
