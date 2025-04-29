module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: [:login]

      def login
        user = User.find_by(email: params[:email])
        if user&.authenticate(params[:password])
          token = user.generate_jwt
          render json: { token: token, user: { id: user.id, email: user.email } }, status: :ok
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      def logout
        # JWTはステートレスなので、クライアント側でトークンを破棄する必要があります
        render json: { message: 'Logged out successfully' }, status: :ok
      end
    end
  end
end
