# frozen_string_literal: true

module PeriodParamsValidator
  extend ActiveSupport::Concern

  private

  # achievement_stats 用: weekly, monthly, custom を検証
  # @return [Hash, nil] 検証成功時は { period:, start_date:, end_date: }、失敗時は nil（render_error 済み）
  def validate_achievement_period_params
    period = params[:period] || 'weekly'
    start_date_param = params[:start_date]
    end_date_param = params[:end_date]

    unless %w[weekly monthly custom].include?(period)
      render_error(
        errors: [ 'periodはweekly、monthly、customのいずれかである必要があります' ],
        status: :bad_request
      )
      return nil
    end

    if period == 'custom'
      if start_date_param.blank? || end_date_param.blank?
        render_error(
          errors: [ 'periodがcustomの場合、start_dateとend_dateは必須です' ],
          status: :bad_request
        )
        return nil
      end
    end

    start_date = nil
    end_date = nil

    if start_date_param.present? && end_date_param.present?
      begin
        start_date = Date.parse(start_date_param)
        end_date = Date.parse(end_date_param)
      rescue ArgumentError
        render_error(
          errors: [ 'start_dateとend_dateは有効な日付形式である必要があります' ],
          status: :bad_request
        )
        return nil
      end

      if start_date > end_date
        render_error(
          errors: [ 'start_dateはend_dateより前である必要があります' ],
          status: :bad_request
        )
        return nil
      end
    end

    {
      period: period,
      start_date: start_date,
      end_date: end_date
    }
  end

  # achievement_trend 用: weekly, monthly を検証（period は必須）
  # @return [Hash, nil] 検証成功時は { period:, weeks:, months: }、失敗時は nil（render_error 済み）
  def validate_trend_period_params
    period = params[:period]
    weeks = params[:weeks] || 4
    months = params[:months] || 3

    unless %w[weekly monthly].include?(period)
      render_error(
        errors: [ 'periodはweeklyまたはmonthlyである必要があります' ],
        status: :bad_request
      )
      return nil
    end

    if period == 'weekly'
      weeks = weeks.to_i
      if weeks < 1 || weeks > 52
        render_error(
          errors: [ 'weeksは1以上52以下である必要があります' ],
          status: :bad_request
        )
        return nil
      end
    end

    if period == 'monthly'
      months = months.to_i
      if months < 1 || months > 24
        render_error(
          errors: [ 'monthsは1以上24以下である必要があります' ],
          status: :bad_request
        )
        return nil
      end
    end

    {
      period: period,
      weeks: weeks,
      months: months
    }
  end

  # with_achievement_stats 用: weekly, monthly を検証（period は任意、デフォルト weekly）
  # @return [String, nil] 検証成功時は period 文字列、失敗時は nil（render_error 済み）
  def validate_simple_period
    period = params[:period] || 'weekly'
    return period if %w[weekly monthly].include?(period)

    render_error(
      errors: [ 'periodはweeklyまたはmonthlyである必要があります' ],
      status: :bad_request
    )
    nil
  end
end
