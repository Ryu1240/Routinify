/**
 * 日付をISO形式（YYYY-MM-DD）の文字列に変換
 * nullの場合はnullを返す
 * @param date - 変換するDateオブジェクト（null可）
 * @returns YYYY-MM-DD形式の文字列、またはnull
 */
export const formatDate = (date: Date | null): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 日付をISO形式（YYYY-MM-DD）の文字列に変換
 * @param date - 変換するDateオブジェクト
 * @returns YYYY-MM-DD形式の文字列
 */
export const formatDateToISO = (date: Date): string => {
  const result = formatDate(date);
  if (result === null) {
    throw new Error('Cannot format null date');
  }
  return result;
};

/**
 * 日付を表示用形式（YYYY/MM/DD）の文字列に変換
 * @param date - 変換するDateオブジェクト
 * @returns YYYY/MM/DD形式の文字列
 */
export const formatDateToDisplay = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 日付文字列を表示用形式（YYYY/MM/DD）の文字列に変換
 * @param dateString - 変換する日付文字列（ISO形式など）
 * @returns YYYY/MM/DD形式の文字列
 */
export const formatDateStringToDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDateToDisplay(date);
};

/**
 * 日付範囲を表示用形式（YYYY/MM/DD - YYYY/MM/DD）の文字列に変換
 * @param start - 開始日
 * @param end - 終了日
 * @returns YYYY/MM/DD - YYYY/MM/DD形式の文字列
 */
export const formatDateRange = (start: Date, end: Date): string => {
  return `${formatDateToDisplay(start)} - ${formatDateToDisplay(end)}`;
};

/**
 * 指定されたオフセットの週の開始日と終了日をDateオブジェクトで取得
 * 週は月曜日始まりとする
 * @param offset - 週のオフセット（0: 今週、-1: 先週、1: 来週）
 * @returns 週の開始日と終了日のDateオブジェクト
 */
export const getWeekRangeDates = (
  offset: number
): { start: Date; end: Date } => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (日) から 6 (土)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を週の開始とする

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + offset * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
};

/**
 * 指定されたオフセットの週の開始日と終了日をISO形式の文字列で取得
 * 週は月曜日始まりとする
 * @param offset - 週のオフセット（0: 今週、-1: 先週、1: 来週）
 * @returns 週の開始日と終了日のISO形式文字列
 */
export const getWeekRangeStrings = (
  offset: number
): { start: string; end: string } => {
  const { start, end } = getWeekRangeDates(offset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  if (startStr === null || endStr === null) {
    throw new Error('Cannot format week range dates');
  }
  return {
    start: startStr,
    end: endStr,
  };
};

/**
 * 指定されたオフセットの月の開始日と終了日をDateオブジェクトで取得
 * @param offset - 月のオフセット（0: 今月、-1: 先月、1: 来月）
 * @returns 月の開始日と終了日のDateオブジェクト
 */
export const getMonthRangeDates = (
  offset: number
): { start: Date; end: Date } => {
  const today = new Date();
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth() + offset,
    1
  );
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + offset + 1,
    0
  );
  monthEnd.setHours(23, 59, 59, 999);

  return { start: monthStart, end: monthEnd };
};

/**
 * 指定されたオフセットの月の開始日と終了日をISO形式の文字列で取得
 * @param offset - 月のオフセット（0: 今月、-1: 先月、1: 来月）
 * @returns 月の開始日と終了日のISO形式文字列
 */
export const getMonthRangeStrings = (
  offset: number
): { start: string; end: string } => {
  const { start, end } = getMonthRangeDates(offset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  if (startStr === null || endStr === null) {
    throw new Error('Cannot format month range dates');
  }
  return {
    start: startStr,
    end: endStr,
  };
};
