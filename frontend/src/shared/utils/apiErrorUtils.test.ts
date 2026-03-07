import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { handleApiError } from './apiErrorUtils';

const mockShow = vi.fn();
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockShow(...args) },
}));

describe('apiErrorUtils', () => {
  beforeEach(() => {
    mockShow.mockClear();
  });

  describe('handleApiError', () => {
    it('shows notification with defaultMessage when error is not Axios error', () => {
      const err = new Error('network');
      handleApiError(err, { defaultMessage: '通信に失敗しました。' });
      expect(mockShow).toHaveBeenCalledWith({
        title: 'エラー',
        message: '通信に失敗しました。',
        color: 'red',
        autoClose: 5000,
      });
    });

    it('does not show notification when notify is false', () => {
      handleApiError(new Error('err'), {
        defaultMessage: '失敗',
        notify: false,
      });
      expect(mockShow).not.toHaveBeenCalled();
    });

    it('uses response.data.message for Axios error when present', () => {
      const err = new axios.AxiosError(
        'Bad Request',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 400,
          data: { message: 'バリデーションエラーです。' },
        } as axios.InternalAxiosRequestConfig
      );
      handleApiError(err, { defaultMessage: 'フォールバック' });
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'バリデーションエラーです。' })
      );
    });

    it('uses status-based message for Axios error when response.data.message is empty', () => {
      const err = new axios.AxiosError(
        'Forbidden',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 403,
          data: {},
        } as axios.InternalAxiosRequestConfig
      );
      handleApiError(err, { defaultMessage: 'フォールバック' });
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: '権限がありません。' })
      );
    });

    it('uses status-based message for 404', () => {
      const err = new axios.AxiosError(
        'Not Found',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        { status: 404, data: {} } as axios.InternalAxiosRequestConfig
      );
      handleApiError(err);
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'リソースが見つかりません。' })
      );
    });

    it('uses status-based message for 422', () => {
      const err = new axios.AxiosError(
        'Unprocessable Entity',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        { status: 422, data: {} } as axios.InternalAxiosRequestConfig
      );
      handleApiError(err);
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: '入力内容を確認してください。' })
      );
    });

    it('falls back to defaultMessage when Axios error has no status', () => {
      const err = new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
        undefined,
        undefined,
        undefined
      );
      handleApiError(err, { defaultMessage: '接続できませんでした。' });
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: '接続できませんでした。' })
      );
    });

    it('uses default DEFAULT_MESSAGE when no options provided', () => {
      handleApiError(new Error('unknown'));
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'エラーが発生しました。しばらく時間をおいて再度お試しください。',
        })
      );
    });
  });
});
