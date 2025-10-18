module Api
  module V1
    class BaseController < ApplicationController
      include ErrorHandler
      include ResponseFormatter

      before_action :set_pagination_params

      private

      def set_pagination_params
        @page = params[:page]&.to_i || 1
        @per_page = params[:per_page]&.to_i || 20
      end
    end
  end
end
