# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JobStatusService do
  let(:job_id) { SecureRandom.uuid }
  let(:redis) { Redis.new(url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0')) }
  let(:service) { described_class.new }

  before do
    redis.flushdb
  end

  after do
    redis.close
  end

  describe '#create_pending' do
    it 'pending ステータスで Redis に保存すること' do
      service.create_pending(job_id)

      status = service.find(job_id)
      expect(status[:jobId]).to eq(job_id)
      expect(status[:status]).to eq('pending')
      expect(status[:completed]).to be false
      expect(status[:createdAt]).to be_present
    end
  end

  describe '#update' do
    it 'status と completed を更新すること' do
      service.create_pending(job_id)
      service.update(job_id, status: 'running', completed: false)

      status = service.find(job_id)
      expect(status[:status]).to eq('running')
      expect(status[:completed]).to be false
    end

    it 'generated_tasks_count を渡した場合に保存すること' do
      service.update(job_id, status: 'completed', completed: true, generated_tasks_count: 5)

      status = service.find(job_id)
      expect(status[:generatedTasksCount]).to eq(5)
    end

    it 'error を渡した場合に保存すること' do
      service.update(job_id, status: 'failed', completed: true, error: 'テストエラー')

      status = service.find(job_id)
      expect(status[:error]).to eq('テストエラー')
    end

    it 'completed_at を渡した場合に保存すること' do
      completed_at = Time.current
      service.update(job_id, status: 'completed', completed: true, completed_at: completed_at)

      status = service.find(job_id)
      expect(status[:completedAt]).to eq(completed_at.iso8601)
    end
  end

  describe '#find' do
    it '存在するジョブのステータスを返すこと' do
      service.create_pending(job_id)

      status = service.find(job_id)
      expect(status).to be_a(Hash)
      expect(status[:jobId]).to eq(job_id)
    end

    it '存在しないジョブの場合は nil を返すこと' do
      status = service.find('non-existent-job-id')

      expect(status).to be_nil
    end
  end
end
