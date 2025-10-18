import axios from '../../../config/axios';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../../types/category';

type CategoryResponse = {
  data: Category[];
};

type CategoryRequestBody = {
  category: {
    name: string;
  };
};

export const categoriesApi = {
  fetchAll: async (): Promise<Category[]> => {
    const response = await axios.get<CategoryResponse>('/api/v1/categories');
    return response.data.data;
  },

  create: async (categoryData: CreateCategoryDto): Promise<void> => {
    const body: CategoryRequestBody = {
      category: {
        name: categoryData.name,
      },
    };
    await axios.post('/api/v1/categories', body);
  },

  update: async (
    categoryId: number,
    categoryData: UpdateCategoryDto
  ): Promise<void> => {
    const body: CategoryRequestBody = {
      category: {
        name: categoryData.name,
      },
    };
    await axios.put(`/api/v1/categories/${categoryId}`, body);
  },

  delete: async (categoryId: number): Promise<void> => {
    await axios.delete(`/api/v1/categories/${categoryId}`);
  },
};
