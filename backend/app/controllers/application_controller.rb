class ApplicationController < ActionController::API
    include Secured

    class << self
        attr_accessor :skip_auth_for_test
    end

    before_action :authorize, unless: -> { self.class.skip_auth_for_test }
end
