import { request } from './client'
import type { Category } from '../types/category'

type CategoriesResponse = {
  items: Category[]
}

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const data = await request<CategoriesResponse>('/api/categories', { signal })
  return data.items
}
