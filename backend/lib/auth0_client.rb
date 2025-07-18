# frozen_string_literal: true

require 'jwt'
require 'net/http'
require 'set'

# Auth0Client class to handle JWT token validation
class Auth0Client
  # Auth0 Client Objects
  Error = Struct.new(:message, :status)
  Response = Struct.new(:decoded_token, :error)
  Token = Struct.new(:token) do
    def validate_permissions(permissions)
        required_permissions = Set.new permissions
        scopes = token[0]['scope']
        token_permissions = scopes && !scopes.empty? ? Set.new(scopes.split(' ')) : Set.new
        required_permissions <= token_permissions
    end
  end

  # Helper Functions
  def self.domain_url
    # .envファイルから環境変数を読み込む
    require 'dotenv'
    Dotenv.load
    "https://#{ENV['AUTH0_DOMAIN']}/"
  end

  def self.decode_token(token, jwks_hash)
    JWT.decode(token, nil, true, {
         algorithm: 'RS256',
         iss: domain_url,
         verify_iss: true,
         aud: ENV['AUTH0_AUDIENCE'] || ENV['REACT_APP_AUTH0_AUDIENCE'],
         verify_aud: true,
         jwks: { keys: jwks_hash[:keys] }
       })
  end

  def self.get_jwks
    jwks_uri = URI("#{domain_url}.well-known/jwks.json")
    Net::HTTP.get_response jwks_uri
  end

  # Token Validation
  def self.validate_token(token)
    jwks_response = get_jwks

    unless jwks_response.is_a? Net::HTTPSuccess
        error = Error.new(message: 'Unable to verify credentials', status: :internal_server_error)
        return Response.new(nil, error)
    end

    jwks_hash = JSON.parse(jwks_response.body).deep_symbolize_keys

    decoded_token = decode_token(token, jwks_hash)

    Response.new(Token.new(decoded_token), nil)
    rescue JWT::VerificationError, JWT::DecodeError => e
    error = Error.new('Bad credentials', :unauthorized)
    Response.new(nil, error)
  end
end
