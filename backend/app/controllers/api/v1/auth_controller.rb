# frozen_string_literal: true

module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authorize, only: [ :login ]

      def login
        auth0_token = params[:auth0_token]

        if auth0_token.blank?
          return render_error(
            errors: [ 'auth0_token is required' ],
            message: 'auth0_token is required',
            status: :bad_request
          )
        end

        result = AuthService.authenticate(auth0_token)

        if result[:success]
          render_success(data: result[:data])
        else
          render_error(
            errors: [ result[:error] ],
            message: result[:error],
            status: :unauthorized
          )
        end
      end
    end
  end
end
