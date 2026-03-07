import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { categoriesApi } from '../categoriesApi';
import type { Category } from '@/types/category';

vi.mock('@/lib/axios');

describe('categoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('GET /api/v1/categories を呼び出しカテゴリ一覧を返すこと', async () => {
      const mockCategories: Category[] = [
        {
          id: 1,
          accountId: 'acc-1',
          name: 'Work',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: mockCategories },
      });

      const result = await categoriesApi.fetchAll();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/categories');
      expect(result).toEqual(mockCategories);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(categoriesApi.fetchAll()).rejects.toThrow('Network error');
    });
  });

  describe('create', () => {
    it('POST /api/v1/categories を正しい body で呼び出すこと', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await categoriesApi.create({ name: 'New Category' });

      expect(axios.post).toHaveBeenCalledWith('/api/v1/categories', {
        category: { name: 'New Category' },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(categoriesApi.create({ name: 'New' })).rejects.toThrow(
        'Create failed'
      );
    });
  });

  describe('update', () => {
    it('PUT /api/v1/categories/:id を正しい body で呼び出すこと', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await categoriesApi.update(1, { name: 'Updated Category' });

      expect(axios.put).toHaveBeenCalledWith('/api/v1/categories/1', {
        category: { name: 'Updated Category' },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        categoriesApi.update(1, { name: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('DELETE /api/v1/categories/:id を呼び出すこと', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await categoriesApi.delete(1);

      expect(axios.delete).toHaveBeenCalledWith('/api/v1/categories/1');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(categoriesApi.delete(1)).rejects.toThrow('Delete failed');
    });
  });
});
