# frozen_string_literal: true

class JobStatusService
  TTL_SECONDS = 24.hours.to_i
  KEY_PREFIX = 'job_status:'

  def create_pending(job_id)
    update(job_id, status: 'pending', completed: false)
  end

  def update(job_id, status:, completed:, **options)
    redis = connect_redis

    job_data = {
      jobId: job_id,
      status: status,
      completed: completed,
      createdAt: options[:created_at]&.iso8601 || Time.current.iso8601
    }

    job_data[:generatedTasksCount] = options[:generated_tasks_count] if options[:generated_tasks_count]
    job_data[:error] = options[:error] if options[:error]
    job_data[:completedAt] = options[:completed_at].iso8601 if options[:completed_at]

    redis.setex(key_for(job_id), TTL_SECONDS, job_data.to_json)
  ensure
    redis&.close
  end

  def find(job_id)
    redis = connect_redis
    json = redis.get(key_for(job_id))
    return nil if json.blank?

    JSON.parse(json, symbolize_names: true)
  ensure
    redis&.close
  end

  private

  def key_for(job_id)
    "#{KEY_PREFIX}#{job_id}"
  end

  def connect_redis
    Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0'))
  end
end
