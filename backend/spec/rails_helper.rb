# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?
# Uncomment the line below in case you have `--require rails_helper` in the `.rspec` file
# that will avoid rails generators crashing because migrations haven't been run yet
# return unless Rails.env.test?
require 'rspec/rails'
require 'factory_bot_rails'
# Add additional requires below this line. Rails is not loaded until this point!

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot-up time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
Rails.root.glob('spec/support/**/*.rb').sort_by(&:to_s).each { |f| require f }

# Ensures that the test database schema matches the current schema file.
# Note: This project uses Ridgepole instead of Rails migrations.
# Therefore, we apply Ridgepole schema before running tests.
RSpec.configure do |config|
  # Apply Ridgepole schema before running tests
  # This ensures the test database schema is always up-to-date
  config.before(:suite) do
    unless ENV['SKIP_RIDGEPOLE_APPLY'] == 'true'
      schema_file = Rails.root.join('db', 'Schemafile')
      config_file = Rails.root.join('config', 'database.yml')

      if File.exist?(schema_file) && File.exist?(config_file)
        puts 'Applying Ridgepole schema to test database...'

        # Check if test database has tables
        ActiveRecord::Base.establish_connection(:test)
        has_tables = ActiveRecord::Base.connection.tables.any? { |t| !t.start_with?('schema_migrations', 'ar_internal_metadata') }

        unless has_tables
          # Export schema from development database using pg_dump via Docker
          # This is more reliable than Ridgepole's --export for empty databases
          dev_db_config = ActiveRecord::Base.configurations.configs_for(env_name: 'development').first
          test_db_config = ActiveRecord::Base.configurations.configs_for(env_name: 'test').first

          if dev_db_config && test_db_config
            schema_sql = Rails.root.join('tmp', 'test_schema.sql')
            dev_hash = dev_db_config.configuration_hash
            test_hash = test_db_config.configuration_hash

            # Use docker-compose exec to run pg_dump from db container
            # Export schema from development database
            export_cmd = "docker compose exec -T db pg_dump -U #{dev_hash[:username] || 'postgres'} -d #{dev_hash[:database]} --schema-only --no-owner --no-acl > #{schema_sql}"
            export_result = system(export_cmd, out: File::NULL, err: File::NULL)

            if export_result && File.exist?(schema_sql) && File.size(schema_sql) > 0
              # Apply schema to test database
              apply_cmd = "docker compose exec -T db psql -U #{test_hash[:username] || 'postgres'} -d #{test_hash[:database]} < #{schema_sql}"
              apply_result = system(apply_cmd, out: File::NULL, err: File::NULL)

              unless apply_result
                puts "\n⚠️  Failed to apply schema to test database. Tests may fail."
                puts "   You can skip schema application by setting SKIP_RIDGEPOLE_APPLY=true"
              end
            else
              puts "⚠️  Failed to export schema from development database."
            end
          end
        end

        # Ensure db/schema.rb exists for maintain_test_schema!
        # Note: db/schema.rb should be generated automatically when Ridgepole is applied
        # via make ridgepole-apply. If it doesn't exist, generate it here as a fallback.
        schema_rb = Rails.root.join('db', 'schema.rb')
        unless File.exist?(schema_rb) && File.size(schema_rb) > 100
          puts '⚠️  db/schema.rb not found. Generating from development database...'
          system(
            "RAILS_ENV=development bundle exec rails db:schema:dump",
            out: File::NULL,
            err: File::NULL
          )
        end
      else
        puts "⚠️  Schemafile or database.yml not found. Skipping Ridgepole schema application."
      end
    end
  end

  # Use maintain_test_schema! after Ridgepole schema is applied
  # This ensures db/schema.rb is up-to-date for subsequent test runs
  begin
    ActiveRecord::Migration.maintain_test_schema!
  rescue ActiveRecord::PendingMigrationError => e
    abort e.to_s.strip
  end
  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_paths = [
    Rails.root.join('spec/fixtures')
  ]

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # You can uncomment this line to turn off ActiveRecord support entirely.
  # config.use_active_record = false

  # RSpec Rails uses metadata to mix in different behaviours to your tests,
  # for example enabling you to call `get` and `post` in request specs. e.g.:
  #
  #     RSpec.describe UsersController, type: :request do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://rspec.info/features/8-0/rspec-rails
  #
  # You can also this infer these behaviours automatically by location, e.g.
  # /spec/models would pull in the same behaviour as `type: :model` but this
  # behaviour is considered legacy and will be removed in a future version.
  #
  # To enable this behaviour uncomment the line below.
  # config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!
  # arbitrary gems may also be filtered via:
  # config.filter_gems_from_backtrace("gem name")

  # FactoryBotの設定
  config.include FactoryBot::Syntax::Methods

  # AuthorizationHelperの設定
  config.include AuthorizationHelper

  # ActiveJob のテストヘルパーを有効化
  config.include ActiveJob::TestHelper
end
