import { apiClient } from '../client';
import type { MetaItem } from '../types';

export const metaApi = {
  qarks: () => apiClient.get<MetaItem[]>('/meta/qarks', { auth: false }),
  categories: () => apiClient.get<MetaItem[]>('/meta/categories', { auth: false }),
};
