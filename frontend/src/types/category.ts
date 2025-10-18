export type Category = {
  readonly id: number;
  readonly accountId: string;
  name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateCategoryDto = {
  name: string;
};

export type UpdateCategoryDto = {
  name: string;
};
