export interface Category {
  id: number;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name: string;
}
