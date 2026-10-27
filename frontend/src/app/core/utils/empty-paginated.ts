import { Paginated } from '../models';

export const emptyPaginated = <T>(): Paginated<T> => ({
  data: [],
  meta: {
    pagination: {
      page: 1,
      pageSize: 0,
      total: 0,
      pageCount: 0,
    },
  },
});
