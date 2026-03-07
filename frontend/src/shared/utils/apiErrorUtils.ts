import axios from 'axios';
import { notifications } from '@mantine/notifications';

const DEFAULT_MESSAGE =
  'エラーが発生しました。しばらく時間をおいて再度お試しください。';

/**
 * HTTPステータスに応じたユーザー向けメッセージを返す
 */
function getMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'リクエストが不正です。';
    case 403:
      return '権限がありません。';
    case 404:
      return 'リソースが見つかりません。';
    case 422:
      return '入力内容を確認してください。';
    default:
      return DEFAULT_MESSAGE;
  }
}

export type HandleApiErrorOptions = {
  defaultMessage?: string;
  notify?: boolean;
};

/**
 * APIエラーを共通処理する: console.error でログ出力し、オプションで Mantine の通知を表示する。
 * モーダルや mutation の catch で呼び出す。
 *
 * @param error - catch で受け取った unknown なエラー
 * @param options - defaultMessage: 通知に表示する文言のフォールバック。notify: false のときは通知しない（ログのみ、フォールバック用途）
 */
export function handleApiError(
  error: unknown,
  options?: HandleApiErrorOptions
): void {
  const { defaultMessage = DEFAULT_MESSAGE, notify = true } = options ?? {};
  const message = resolveMessage(error, defaultMessage);

  console.error(message, error);

  if (notify) {
    notifications.show({
      title: 'エラー',
      message,
      color: 'red',
      autoClose: 5000,
    });
  }
}

function resolveMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: string }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }

  if (status) {
    return getMessageForStatus(status);
  }

  return fallback;
}
