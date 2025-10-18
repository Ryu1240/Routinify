class FutureDateValidator < ActiveModel::EachValidator

  def validate_each(record, attribute, value)
    return if value.blank?
    return if Rails.env.test? && options[:allow_past_in_test] # テスト環境では過去の日付を許可

    if value <= Time.current
      record.errors.add(attribute, 'は未来の日付である必要があります')
    end
  end

end
