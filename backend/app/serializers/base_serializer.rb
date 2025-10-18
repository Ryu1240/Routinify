class BaseSerializer

  def initialize(object)
    @object = object
  end

  def as_json
    raise NotImplementedError, 'Subclasses must implement as_json method'
  end

  private

  def format_datetime(datetime)
    datetime&.iso8601
  end

  def format_date(date)
    date&.iso8601
  end

end
