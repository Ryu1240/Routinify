export type Category = {
  id: number;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCategoryDto = {
  name: string;
}

export type UpdateCategoryDto = {
  name: string;
}
